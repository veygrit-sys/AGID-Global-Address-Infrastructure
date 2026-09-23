package = "agid"
version = "1.0.0-1"
source = { url = "git://github.com/agid/agid-lua" }
description = {
  summary = "AGID Lua SDK",
  license = "MIT"
}
build = {
  type = "builtin",
  modules = {
    agid = "agid.lua"
  }
}
