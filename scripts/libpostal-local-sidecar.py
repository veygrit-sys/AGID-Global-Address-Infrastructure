#!/usr/bin/env python3
"""Loopback-only HTTP adapter for a locally installed libpostal library."""

from __future__ import annotations

import argparse
import ctypes
import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any
from urllib.parse import urlparse


MAX_BODY_BYTES = 16 * 1024
MAX_TEXT_BYTES = 8 * 1024
LOOPBACK_HOSTS = {"127.0.0.1", "::1"}


class LibpostalParserOptions(ctypes.Structure):
    _fields_ = [
        ("language", ctypes.c_char_p),
        ("country", ctypes.c_char_p),
    ]


class LibpostalParserResponse(ctypes.Structure):
    _fields_ = [
        ("num_components", ctypes.c_size_t),
        ("components", ctypes.POINTER(ctypes.c_char_p)),
        ("labels", ctypes.POINTER(ctypes.c_char_p)),
    ]


class LocalLibpostal:
    def __init__(self) -> None:
        library_name = os.environ.get("AGID_LIBPOSTAL_LIBRARY", "libpostal.so.1")
        self.library = ctypes.CDLL(library_name)
        self.library.libpostal_setup.restype = ctypes.c_bool
        self.library.libpostal_setup_parser.restype = ctypes.c_bool
        self.library.libpostal_get_address_parser_default_options.restype = LibpostalParserOptions
        self.library.libpostal_parse_address.argtypes = [ctypes.c_char_p, LibpostalParserOptions]
        self.library.libpostal_parse_address.restype = ctypes.POINTER(LibpostalParserResponse)
        self.library.libpostal_address_parser_response_destroy.argtypes = [
            ctypes.POINTER(LibpostalParserResponse),
        ]

        if not self.library.libpostal_setup() or not self.library.libpostal_setup_parser():
            raise RuntimeError("libpostal initialization failed")

    def parse(self, text: str, country_code: str) -> list[dict[str, str]]:
        options = self.library.libpostal_get_address_parser_default_options()
        country_bytes = country_code.encode("ascii") if country_code else None
        options.country = country_bytes
        response = self.library.libpostal_parse_address(text.encode("utf-8"), options)
        if not response:
            return []

        try:
            return [
                {
                    "label": (response.contents.labels[index] or b"").decode("utf-8", "replace"),
                    "value": (response.contents.components[index] or b"").decode("utf-8", "replace"),
                }
                for index in range(response.contents.num_components)
            ]
        finally:
            self.library.libpostal_address_parser_response_destroy(response)


class LocalLibpostalHandler(BaseHTTPRequestHandler):
    parser: LocalLibpostal

    def log_message(self, _format: str, *_args: Any) -> None:
        # Input text is never written to stdout or a log file.
        return

    def do_GET(self) -> None:
        if urlparse(self.path).path != "/health":
            self._send_json(404, {"error": "not found"})
            return
        self._send_json(200, {"ok": True, "service": "agid-local-libpostal"})

    def do_POST(self) -> None:
        if urlparse(self.path).path != "/parse":
            self._send_json(404, {"error": "not found"})
            return

        payload = self._read_json_body()
        if payload is None:
            return

        text = payload.get("text")
        country_code = payload.get("countryCode", "")
        if not isinstance(text, str) or not text.strip() or len(text.encode("utf-8")) > MAX_TEXT_BYTES:
            self._send_json(400, {"error": "text must be a non-empty value within the local size limit"})
            return
        if not isinstance(country_code, str) or (country_code and not country_code.isascii()) or len(country_code) > 2:
            self._send_json(400, {"error": "countryCode must be an ISO alpha-2 hint"})
            return

        try:
            components = self.parser.parse(text, country_code.lower())
        except Exception:
            self._send_json(503, {"error": "local libpostal parser unavailable"})
            return

        self._send_json(200, {
            "source": "libpostal",
            "available": True,
            "components": components,
        })

    def _read_json_body(self) -> dict[str, Any] | None:
        try:
            content_length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self._send_json(400, {"error": "invalid content length"})
            return None
        if content_length <= 0 or content_length > MAX_BODY_BYTES:
            self._send_json(413, {"error": "request body exceeds the local size limit"})
            return None
        try:
            payload = json.loads(self.rfile.read(content_length).decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            self._send_json(400, {"error": "request body must be JSON"})
            return None
        if not isinstance(payload, dict):
            self._send_json(400, {"error": "request body must be an object"})
            return None
        return payload

    def _send_json(self, status: int, payload: dict[str, Any]) -> None:
        encoded = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(encoded)


def main() -> None:
    argument_parser = argparse.ArgumentParser(description="Run AGID's local libpostal sidecar")
    argument_parser.add_argument("--host", default="127.0.0.1")
    argument_parser.add_argument("--port", default=8765, type=int)
    args = argument_parser.parse_args()

    if args.host not in LOOPBACK_HOSTS:
        argument_parser.error("host must be a loopback address")
    if not 1 <= args.port <= 65535:
        argument_parser.error("port must be between 1 and 65535")

    LocalLibpostalHandler.parser = LocalLibpostal()
    server = ThreadingHTTPServer((args.host, args.port), LocalLibpostalHandler)
    print(f"AGID local libpostal sidecar listening on http://{args.host}:{args.port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
