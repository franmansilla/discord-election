import { Lock } from "lucide-react"

export const metadata = {
  title: "Politica de Privacidad — DiscordVote",
}

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <Lock className="w-7 h-7 text-indigo-400" />
        <h1 className="text-3xl font-bold text-white">Politica de Privacidad</h1>
      </div>
      <p className="text-white/40 text-sm mb-10">Ultima actualizacion: junio 2025</p>

      <div className="prose prose-invert max-w-none space-y-8 text-white/80 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-white mb-3">1. Informacion que recopilamos</h2>
          <p>Al autenticarte con Discord, recopilamos y almacenamos la siguiente informacion:</p>
          <ul className="list-disc list-inside space-y-2 mt-3">
            <li><strong className="text-white">ID de usuario de Discord</strong> — identificador unico de tu cuenta.</li>
            <li><strong className="text-white">Nombre de usuario</strong> — tu nombre visible en Discord.</li>
            <li><strong className="text-white">Avatar</strong> — foto de perfil de tu cuenta de Discord.</li>
            <li><strong className="text-white">Email</strong> — si fue autorizado en el scope de OAuth.</li>
            <li><strong className="text-white">Registro de participacion</strong> — si votaste en una eleccion (fecha y hora), pero NO a quien votaste.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">2. Uso de la informacion</h2>
          <p>Usamos tu informacion exclusivamente para:</p>
          <ul className="list-disc list-inside space-y-2 mt-3">
            <li>Autenticarte en la plataforma.</li>
            <li>Garantizar que cada usuario vote una sola vez por eleccion.</li>
            <li>Mostrar tu nombre de usuario e imagen en la sesion activa.</li>
            <li>Generar el registro de auditoria (quienes votaron, sin revelar el voto).</li>
          </ul>
          <p className="mt-3">
            <strong className="text-white">No vendemos, compartimos ni cedemos tu informacion a terceros.</strong>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">3. Anonimato del voto</h2>
          <p>
            Tu voto es secreto. El sistema registra que participaste en una eleccion, pero el
            candidato por el que votaste <strong className="text-white">nunca es visible</strong> para
            los administradores ni para otros usuarios. Solo se revelan los totales por candidato
            cuando el administrador lo activa.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">4. Almacenamiento de datos</h2>
          <p>
            Los datos se almacenan en una base de datos PostgreSQL segura. Las sesiones se
            gestionan de forma segura mediante cookies encriptadas (NextAuth.js). No almacenamos
            contraseñas — la autenticacion es delegada completamente a Discord.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">5. Retencion de datos</h2>
          <p>
            Conservamos tu informacion mientras uses el servicio. Puedes solicitar la eliminacion
            de tu cuenta y datos en cualquier momento contactando al administrador de la
            plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">6. Servicios de terceros</h2>
          <p>Utilizamos los siguientes servicios externos:</p>
          <ul className="list-disc list-inside space-y-2 mt-3">
            <li>
              <strong className="text-white">Discord OAuth2</strong> — para autenticacion.
              Aplica la{" "}
              <a
                href="https://discord.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 underline"
              >
                Politica de Privacidad de Discord
              </a>.
            </li>
            <li>
              <strong className="text-white">Vercel</strong> — para hosting y base de datos.
              Aplica la{" "}
              <a
                href="https://vercel.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 underline"
              >
                Politica de Privacidad de Vercel
              </a>.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">7. Tus derechos</h2>
          <p>Tenes derecho a:</p>
          <ul className="list-disc list-inside space-y-2 mt-3">
            <li>Acceder a los datos que tenemos sobre vos.</li>
            <li>Solicitar la correccion de datos incorrectos.</li>
            <li>Solicitar la eliminacion de tus datos.</li>
            <li>Revocar el acceso de la aplicacion desde tu cuenta de Discord en cualquier momento.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">8. Contacto</h2>
          <p>
            Para ejercer tus derechos o consultar sobre esta politica, contacta al administrador
            de la plataforma a traves del servidor de Discord o los canales habilitados.
          </p>
        </section>
      </div>
    </div>
  )
}
