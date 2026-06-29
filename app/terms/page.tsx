import { Shield } from "lucide-react"

export const metadata = {
  title: "Terminos de Servicio — DiscordVote",
}

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="w-7 h-7 text-indigo-400" />
        <h1 className="text-3xl font-bold text-white">Terminos de Servicio</h1>
      </div>
      <p className="text-white/40 text-sm mb-10">Ultima actualizacion: junio 2025</p>

      <div className="prose prose-invert max-w-none space-y-8 text-white/80 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-white mb-3">1. Aceptacion de los terminos</h2>
          <p>
            Al acceder y utilizar DiscordVote, aceptas quedar vinculado por estos Terminos de
            Servicio. Si no estas de acuerdo con alguna parte de estos terminos, no debes usar
            el servicio.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">2. Descripcion del servicio</h2>
          <p>
            DiscordVote es una plataforma de votaciones electronicas diseñada para comunidades
            de Discord. Permite crear elecciones, registrar votos de usuarios autenticados con
            Discord y visualizar resultados de forma transparente y auditada.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">3. Uso permitido</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Solo puedes votar una vez por eleccion activa.</li>
            <li>No puedes intentar manipular, falsificar o duplicar votos.</li>
            <li>No puedes usar el servicio para actividades ilegales o que violen los Terminos de Servicio de Discord.</li>
            <li>No puedes intentar acceder a datos de otros usuarios sin autorizacion.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">4. Autenticacion con Discord</h2>
          <p>
            Para votar, es necesario iniciar sesion con una cuenta de Discord valida. Al
            autenticarte, autorizas a DiscordVote a acceder a tu informacion basica de perfil
            (nombre de usuario, ID y avatar) de acuerdo con los permisos OAuth2 solicitados.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">5. Integridad del voto</h2>
          <p>
            El sistema garantiza que cada usuario vote una sola vez por eleccion. Los votos son
            anonimos: los administradores pueden ver <strong>quienes votaron</strong>, pero no
            <strong> a quien votaron</strong>. Los resultados solo se revelan cuando el
            administrador lo decide explicitamente.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">6. Limitacion de responsabilidad</h2>
          <p>
            DiscordVote se provee &quot;tal cual&quot;, sin garantias de ningun tipo. No nos
            hacemos responsables por decisiones tomadas en base a los resultados de las
            elecciones realizadas en esta plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">7. Modificaciones</h2>
          <p>
            Nos reservamos el derecho de modificar estos terminos en cualquier momento. El uso
            continuo del servicio despues de los cambios implica la aceptacion de los nuevos
            terminos.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">8. Contacto</h2>
          <p>
            Para consultas sobre estos terminos, podras contactarnos a traves del servidor de
            Discord correspondiente o mediante los canales habilitados por el administrador de
            la plataforma.
          </p>
        </section>
      </div>
    </div>
  )
}
