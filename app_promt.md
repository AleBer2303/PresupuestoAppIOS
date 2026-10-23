Actúa como un desarrollador senior de React Native y Expo. Inicializa y estructura una aplicación de finanzas personales y control de presupuestos mes a mes optimizada para iOS, offline-first y escrita en TypeScript estricto.

### Especificaciones técnicas:
1. Base: Expo con expo-router (File-based routing).
2. Persistencia: Expo SQLite configurado con Drizzle ORM.
3. UI y Estilos: NativeWind (Tailwind) y Lucide React Native.
4. Estado global: Zustand para el mes seleccionado, divisas y resumen de balance.
5. Gráficos: react-native-gifted-charts.

### Requisitos funcionales mínimos del MVP:
1. Esquema de datos:
   - Tabla `categories`: id, name, icon, color, type (income/expense).
   - Tabla `transactions`: id, amount (float/integer en centavos), type, category_id, date (timestamp ISO), note.
   - Tabla `budgets`: id, category_id, month (YYYY-MM), limit_amount.
2. Vistas principales:
   - Dashboard: Balance del mes actual (Ingresos vs Gastos), barra de progreso del presupuesto general y accesos rápidos.
   - Presupuesto mensual: Lista de categorías con barra de progreso (gastado vs asignado) y alertas visuales si se supera el 80% o 100%.
   - Registro de transacción: Formulario rápido con modal/bottom-sheet para monto, categoría, fecha y tipo.
   - Historial: Lista agrupada por fecha con filtro por mes.

### Tarea inmediata:
Proporciona los comandos CLI para inicializar las dependencias necesarias, crea el archivo de esquema de la base de datos, el cliente de conexión SQLite, y el layout base con pestañas (Tabs) en expo-router. Comienza ejecutando las configuraciones iniciales.