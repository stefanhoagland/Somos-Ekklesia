import { createTransport } from "nodemailer";

// Correo saliente por SMTP (pensado para Brevo, sirve cualquier proveedor).
// Se configura con variables de entorno en el contenedor.
const config = {
  host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
  port: Number(process.env.SMTP_PUERTO || 587),
  usuario: process.env.SMTP_USUARIO || "",
  clave: process.env.SMTP_CLAVE || "",
  remitente: process.env.CORREO_REMITENTE || "",
};

export const sitioUrl = () => (process.env.SITIO_URL || "").replace(/\/+$/, "");

// Qué variables faltan para poder enviar correos.
export function variablesQueFaltan(): string[] {
  const faltan: string[] = [];
  if (!config.usuario) faltan.push("SMTP_USUARIO");
  if (!config.clave) faltan.push("SMTP_CLAVE");
  if (!config.remitente) faltan.push("CORREO_REMITENTE");
  if (!sitioUrl()) faltan.push("SITIO_URL");
  return faltan;
}

let transporte: ReturnType<typeof createTransport> | null = null;

export async function enviarCorreo(c: { para: string; asunto: string; texto: string; html: string }) {
  transporte ??= createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.usuario, pass: config.clave },
  });
  await transporte.sendMail({
    from: config.remitente,
    to: c.para,
    subject: c.asunto,
    text: c.texto,
    html: c.html,
  });
}

const escapar = (s: string) =>
  s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);

export function correoInvitacion(iglesia: string, codigo: string, email: string, quienInvita: string) {
  const enlace = `${sitioUrl()}/registro?codigo=${encodeURIComponent(codigo)}&email=${encodeURIComponent(email)}`;
  const asunto = `Te invitamos a ${iglesia} en Somos Ekklesia`;
  const texto =
    `Hola:\n\n${quienInvita} te invita a unirte a ${iglesia} en Somos Ekklesia, ` +
    `donde encontrarás grupos, mensajes, sermones y más.\n\n` +
    `Crea tu cuenta aquí:\n${enlace}\n\nCódigo de la iglesia: ${codigo}\n\nBendiciones.`;
  const html = `<!doctype html><html><body style="margin:0;background:#f7f1e6;font-family:Georgia,serif;color:#1c1917">
  <div style="max-width:480px;margin:0 auto;padding:32px 20px;text-align:center">
    <img src="${sitioUrl()}/logo.svg" width="72" height="72" alt="" style="display:block;margin:0 auto 12px">
    <div style="font-size:22px;font-weight:bold;letter-spacing:2px;color:#2b3a4a">SOMOS EKKLESIA</div>
    <div style="font-size:12px;letter-spacing:6px;color:#8a7558;margin-bottom:24px">ΕΚΚΛΗΣΙΑ</div>
    <p style="font-size:17px;line-height:1.5">${escapar(quienInvita)} te invita a unirte a <b>${escapar(iglesia)}</b>,
      donde encontrarás grupos, mensajes, sermones y más.</p>
    <p style="margin:28px 0"><a href="${enlace}" style="background:#2b3a4a;color:#efe4cf;padding:14px 24px;border-radius:8px;text-decoration:none;font-family:Arial,sans-serif;font-weight:bold">Crear mi cuenta</a></p>
    <p style="font-family:Arial,sans-serif;font-size:13px;color:#78716c">Código de la iglesia: <b style="font-family:monospace;font-size:15px;color:#1c1917">${codigo}</b></p>
  </div></body></html>`;
  return { asunto, texto, html };
}
