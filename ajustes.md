- __Variables de entorno__: definir aquellas necesarias para servicios externos (MercadoPago, email, etc.) para poder levantar el backend en modo dev sin fallas de inyección.
- __Tests e2e__: agregar pruebas con Playwright o Cypress para validar flujos completos de usuario (registro → login → mi cuenta → favoritos → órdenes).
- __Mejoras UI/UX__:

  - Paginación en el historial de órdenes si crece mucho.
  - Indicadores visuales más claros para órdenes pendientes/pagadas/enviadas.
  - Vaciar estado de wishlist si el usuario elimina su cuenta (aunque actualmente no hay endpoint de eliminación).
  - 
  - 
  - Reemplazar la versión placeholder del checkout por la integración completa con el backend (creación de orden, generación de preferencia de pago y redirección a MercadoPago), siguiendo el patrón ya visto en otros proyectos del equipo.
  - Añadir validación de formulario con React Hook Form o similar si se requiere capturar datos del comprador.
  - Probar el flujo completo: agregando productos al carrito, visitando `/checkout` y verificando la redirección al pasarela de pago (en entorno de pruebas).
  - Asegurarse de que el carrito se vacíe tras un pago exitoso (posiblemente en las páginas de éxito/fallo/pendiente).


  - Probar el flujo completo: creación de orden → generación de preference → pago simulado en MercadoPago (sandbox) → webhook → descuento de stock.
  - Añadir pruebas unitarias y de integración para el nuevo módulo de órdenes y el webhook.
  - Revisar y actualizar la documentación de variables de entorno si se requiere agregar más campos (por ejemplo, URL de webhook en MercadoPago dashboard).
