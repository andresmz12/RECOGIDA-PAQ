export type Lang = "en" | "es";

const translations = {
  // ─── Common ───────────────────────────────────────────────────────────────
  "common.back": { en: "Back", es: "Atrás" },
  "common.loading": { en: "Loading...", es: "Cargando..." },
  "common.signIn": { en: "Sign in", es: "Iniciar sesión" },
  "common.signOut": { en: "Sign out", es: "Cerrar sesión" },
  "common.signUp": { en: "Sign up", es: "Registrarse" },
  "common.cancel": { en: "Cancel", es: "Cancelar" },
  "common.track": { en: "Track", es: "Rastrear" },
  "common.home": { en: "Home", es: "Inicio" },
  "common.email": { en: "Email", es: "Correo electrónico" },
  "common.password": { en: "Password", es: "Contraseña" },
  "common.fullName": { en: "Full name", es: "Nombre completo" },
  "common.phone": { en: "Phone", es: "Teléfono" },
  "common.address": { en: "Address", es: "Dirección" },
  "common.city": { en: "City", es: "Ciudad" },
  "common.required": { en: "Required", es: "Requerido" },
  "common.optional": { en: "Optional", es: "Opcional" },
  "common.error.connection": {
    en: "Connection error. Please try again.",
    es: "Error de conexión. Por favor intenta de nuevo.",
  },

  // ─── Login ────────────────────────────────────────────────────────────────
  "login.title": { en: "Sign in", es: "Iniciar sesión" },
  "login.subtitle": { en: "Access your account", es: "Accede a tu cuenta" },
  "login.panel.headline": {
    en: "International logistics\nsimplified.",
    es: "Logística internacional\nsimplificada.",
  },
  "login.panel.sub": {
    en: "Manage pickups, track shipments, and coordinate couriers — all in one place.",
    es: "Gestiona recogidas, rastrea envíos y coordina mensajeros — todo en un solo lugar.",
  },
  "login.stats.pickups": { en: "Pickups", es: "Recogidas" },
  "login.stats.success": { en: "Success", es: "Éxito" },
  "login.stats.response": { en: "Response", es: "Respuesta" },
  "login.forgotPassword": { en: "Forgot password?", es: "¿Olvidaste tu contraseña?" },
  "login.submit": { en: "Sign In →", es: "Iniciar sesión →" },
  "login.submitting": { en: "Signing in...", es: "Iniciando sesión..." },
  "login.noAccount": { en: "Don't have an account?", es: "¿No tienes una cuenta?" },
  "login.signUpHere": { en: "Sign up here", es: "Regístrate aquí" },
  "login.withoutAccount": {
    en: "Request a pickup without an account →",
    es: "Solicitar recogida sin cuenta →",
  },
  "login.error.invalid": {
    en: "Incorrect email or password.",
    es: "Correo o contraseña incorrectos.",
  },
  "login.placeholder.email": { en: "you@email.com", es: "tu@correo.com" },
  "login.placeholder.password": { en: "••••••••", es: "••••••••" },

  // ─── Register ─────────────────────────────────────────────────────────────
  "register.title": { en: "Create account", es: "Crear cuenta" },
  "register.subtitle": { en: "Sign up to track your shipments", es: "Regístrate para rastrear tus envíos" },
  "register.heading": { en: "Create your customer account", es: "Crea tu cuenta de cliente" },
  "register.confirmPassword": { en: "Confirm password", es: "Confirmar contraseña" },
  "register.phoneHelper": { en: "US or international number", es: "Número de EE.UU. o internacional" },
  "register.passwordHelper": { en: "Minimum 6 characters", es: "Mínimo 6 caracteres" },
  "register.submit": { en: "Create Account", es: "Crear Cuenta" },
  "register.submitting": { en: "Creating account...", es: "Creando cuenta..." },
  "register.success": { en: "Account created! Signing you in...", es: "¡Cuenta creada! Iniciando sesión..." },
  "register.haveAccount": { en: "Already have an account?", es: "¿Ya tienes una cuenta?" },
  "register.noAccount": { en: "Continue without an account", es: "Continuar sin cuenta" },
  "register.terms": {
    en: "By creating an account, you agree to our terms of service.",
    es: "Al crear una cuenta, aceptas nuestros términos de servicio.",
  },
  "register.error.name": { en: "Full name is required.", es: "El nombre completo es requerido." },
  "register.error.email": {
    en: "Please enter a valid email address.",
    es: "Por favor ingresa un correo electrónico válido.",
  },
  "register.error.phone": {
    en: "Please enter a valid phone number.",
    es: "Por favor ingresa un número de teléfono válido.",
  },
  "register.error.passwordShort": {
    en: "Password must be at least 6 characters.",
    es: "La contraseña debe tener al menos 6 caracteres.",
  },
  "register.error.passwordMatch": {
    en: "Passwords do not match.",
    es: "Las contraseñas no coinciden.",
  },
  "register.error.failed": {
    en: "Registration failed. Please try again.",
    es: "El registro falló. Por favor intenta de nuevo.",
  },
  "register.error.title": { en: "Registration error", es: "Error de registro" },
  "register.success.title": { en: "Account created!", es: "¡Cuenta creada!" },

  // ─── Pickup form ──────────────────────────────────────────────────────────
  "pickup.pageTitle": { en: "Request a pickup", es: "Solicitar recogida" },
  "pickup.pageSubtitle": {
    en: "Fill out the form and we will coordinate your pickup",
    es: "Completa el formulario y coordinaremos tu recogida",
  },
  "pickup.loggedAs": { en: "Logged in as", es: "Sesión iniciada como" },
  "pickup.goToAccount": { en: "My account", es: "Mi cuenta" },
  "pickup.prefillBanner": {
    en: "Your contact info has been pre-filled from your account.",
    es: "Tu información de contacto fue prellenada desde tu cuenta.",
  },

  "pickup.section.sender": { en: "Your information (Sender)", es: "Tu información (Remitente)" },
  "pickup.field.contactName": { en: "Full name", es: "Nombre completo" },
  "pickup.field.contactPhone": { en: "Phone", es: "Teléfono" },
  "pickup.field.contactEmail": { en: "Email", es: "Correo electrónico" },

  "pickup.section.pickupAddress": { en: "Pickup address (USA)", es: "Dirección de recogida (EE.UU.)" },
  "pickup.field.address": { en: "Address", es: "Dirección" },
  "pickup.field.state": { en: "State", es: "Estado" },
  "pickup.field.zip": { en: "ZIP", es: "Código ZIP" },

  "pickup.section.recipient": { en: "Recipient information", es: "Información del destinatario" },
  "pickup.field.recipientName": { en: "Recipient name", es: "Nombre del destinatario" },
  "pickup.field.primaryPhone": { en: "Primary phone", es: "Teléfono principal" },
  "pickup.field.secondaryPhone": { en: "Secondary phone", es: "Teléfono secundario" },
  "pickup.field.recipientEmail": { en: "Recipient email", es: "Correo del destinatario" },
  "pickup.field.deliveryAddress": { en: "Delivery address", es: "Dirección de entrega" },

  "pickup.section.package": { en: "Your package", es: "Tu paquete" },
  "pickup.field.boxSize": { en: "Box size", es: "Tamaño de caja" },
  "pickup.field.weight": { en: "Estimated weight (lbs)", es: "Peso estimado (lbs)" },
  "pickup.field.weightHint": { en: "Content only, not the box", es: "Solo el contenido, no la caja" },
  "pickup.field.contents": { en: "Package contents", es: "Contenido del paquete" },

  "pickup.section.schedule": { en: "Pickup date and time", es: "Fecha y hora de recogida" },
  "pickup.field.preferredDate": { en: "Preferred date", es: "Fecha preferida" },
  "pickup.field.timeWindow": { en: "Time window", es: "Ventana de tiempo" },
  "pickup.field.instructions": { en: "Special instructions", es: "Instrucciones especiales" },
  "pickup.field.instructionsPlaceholder": {
    en: "e.g. Call before arriving, back door, access code #1234...",
    es: "Ej. Llamar antes de llegar, puerta trasera, código de acceso #1234...",
  },

  "pickup.submit": { en: "Request pickup", es: "Solicitar recogida" },
  "pickup.submitting": { en: "Creating request...", es: "Creando solicitud..." },
  "pickup.haveAccount": { en: "Already have an account?", es: "¿Ya tienes una cuenta?" },
  "pickup.saveRequests": { en: "Sign in to save your requests", es: "Inicia sesión para guardar tus solicitudes" },

  "pickup.success.title": { en: "Request created!", es: "¡Solicitud creada!" },
  "pickup.success.subtitle": {
    en: "We will send you a confirmation email",
    es: "Te enviaremos un correo de confirmación",
  },
  "pickup.success.trackingLabel": { en: "Tracking code", es: "Código de rastreo" },
  "pickup.success.trackingHint": { en: "Save this code to track your pickup", es: "Guarda este código para rastrear tu recogida" },
  "pickup.success.backHome": { en: "← Back to home", es: "← Volver al inicio" },
  "pickup.success.trackPackage": { en: "Track package →", es: "Rastrear paquete →" },

  "pickup.box.small": { en: "Small", es: "Pequeña" },
  "pickup.box.medium": { en: "Medium", es: "Mediana" },
  "pickup.box.large": { en: "Large", es: "Grande" },
  "pickup.box.xlarge": { en: "Extra Large", es: "Extra Grande" },
  "pickup.box.doc": { en: "Envelope / letter", es: "Sobre / carta" },

  "pickup.time.morning": { en: "Morning  8:00 am – 12:00 pm", es: "Mañana  8:00 am – 12:00 pm" },
  "pickup.time.afternoon": { en: "Afternoon  12:00 pm – 5:00 pm", es: "Tarde  12:00 pm – 5:00 pm" },
  "pickup.time.evening": { en: "Evening  5:00 pm – 8:00 pm", es: "Noche  5:00 pm – 8:00 pm" },

  // ─── My account ───────────────────────────────────────────────────────────
  "account.newRequest": { en: "New request", es: "Nueva solicitud" },
  "account.tab.active": { en: "Active", es: "Activas" },
  "account.tab.history": { en: "History", es: "Historial" },
  "account.empty.active": { en: "No active shipments", es: "Sin envíos activos" },
  "account.empty.history": { en: "No shipment history", es: "Sin historial de envíos" },
  "account.empty.activeSub": {
    en: "Create a request to send a package",
    es: "Crea una solicitud para enviar un paquete",
  },
  "account.empty.historySub": {
    en: "Your completed shipments will appear here",
    es: "Tus envíos completados aparecerán aquí",
  },
  "account.firstRequest": { en: "Create first request →", es: "Crear primera solicitud →" },
  "account.stats.total": { en: "Total", es: "Total" },
  "account.stats.active": { en: "Active", es: "Activas" },
  "account.stats.completed": { en: "Completed", es: "Completadas" },
  "account.card.origin": { en: "Origin", es: "Origen" },
  "account.card.destination": { en: "Destination", es: "Destino" },
  "account.card.to": { en: "To:", es: "Para:" },
  "account.card.pickedUp": { en: "PACKAGE PICKED UP", es: "PAQUETE RECOGIDO" },
  "account.card.cancelled": { en: "CANCELLED", es: "CANCELADO" },
  "account.cancel.confirm": {
    en: "Cancel request",
    es: "Cancelar solicitud",
  },
} as const;

export function t(lang: Lang, key: keyof typeof translations): string {
  return translations[key]?.[lang] ?? key;
}

export { translations };
