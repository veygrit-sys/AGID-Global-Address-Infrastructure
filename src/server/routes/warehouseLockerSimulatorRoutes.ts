import type { Express } from 'express';

import {
  buildWarehouseLockerLocalSimulation,
  listWarehouseLockerLocalSimulatorCapabilities,
  type WarehouseLockerLocalSimulatorInput,
} from '../../lib/warehouseLockerLocalSimulator';
import { sendAgidResult } from '../agidResult';
import { objectBody } from '../requestParsing';

export function registerWarehouseLockerSimulatorRoutes(app: Express) {
  app.get('/api/warehouse-locker-simulator/capabilities', (req, res) => {
    sendAgidResult(req, res, {
      ok: true,
      data: listWarehouseLockerLocalSimulatorCapabilities(),
      confidence: 1,
      sources: ['agid-warehouse-locker-local-simulator'],
      warnings: [],
      cache: 'none',
    });
  });

  app.post('/api/warehouse-locker-simulator/run', (req, res) => {
    const simulation = buildWarehouseLockerLocalSimulation(objectBody(req.body) as WarehouseLockerLocalSimulatorInput);
    sendAgidResult(req, res, {
      ok: simulation.status !== 'blocked',
      data: simulation,
      error: simulation.status === 'blocked'
        ? 'Warehouse / locker simulator blocked private material, unsafe script events, or blocked locker/warehouse inputs'
        : undefined,
      confidence: simulation.status === 'ready' ? 1 : simulation.status === 'attention' ? 0.75 : 0.25,
      sources: ['agid-warehouse-locker-local-simulator'],
      warnings: simulation.warnings,
      cache: 'none',
    }, simulation.status === 'blocked' ? 409 : 200);
  });
}
