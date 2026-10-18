/**
 * @nestjs/schedule v12 is ESM-only ('type': 'module'): Node >= 23 lo puede
 * requerir en runtime sin problema, pero el sandbox CJS de Jest no soporta
 * require(esm) y falla con 'Unexpected token \'export\''.
 *
 * Mockeamos el paquete para que ningún spec cargue su archivo ESM. Los jobs
 * programados no se testean: el decorator Cron queda como no-op.
 */
jest.mock('@nestjs/schedule', () => {
  class ScheduleModule {
    static forRoot() {
      // DynamicModule mínimo: app.module.ts llama ScheduleModule.forRoot()
      // y Nest solo necesita la forma { module, providers? , imports? } para
      // registrar el módulo. Los cron jobs no se testean (Cron queda no-op).
      return { module: ScheduleModule, providers: [] };
    }
  }
  return {
    Cron: () => () => undefined,
    Interval: () => () => undefined,
    Timeout: () => () => undefined,
    ScheduleModule,
    SchedulerRegistry: class SchedulerRegistry {},
  };
});
