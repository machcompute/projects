"use client";

export function Explainer() {
  return (
    <div className="rounded-2xl border border-mc-gray/15 bg-white p-5">
      <h3 className="text-sm font-semibold text-mc-dark uppercase tracking-wide mb-4">
        How Lattice Boltzmann Works
      </h3>
      <div className="space-y-3 text-sm text-mc-gray leading-relaxed">
        <p>
          The Lattice Boltzmann Method (LBM) simulates fluid dynamics by
          tracking particle distribution functions on a discrete lattice. Instead
          of solving the Navier-Stokes equations directly, it models mesoscopic
          particle populations that collectively reproduce macroscopic fluid
          behavior.
        </p>
        <div className="rounded-lg bg-mc-dark/[0.03] px-4 py-3 font-mono text-xs text-mc-dark leading-relaxed">
          f<sub>i</sub>(x + c<sub>i</sub>, t+1) = f<sub>i</sub>(x, t) &minus;
          (f<sub>i</sub> &minus; f<sub>i</sub><sup>eq</sup>) / &tau;
        </div>
        <ul className="space-y-1.5 pl-4">
          <li className="flex gap-2">
            <span className="font-mono text-mc-dark font-semibold shrink-0">1</span>
            <span>
              <strong>Collision</strong> &mdash; distributions relax toward
              equilibrium at rate 1/&tau;, where &tau; controls viscosity.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-mono text-mc-dark font-semibold shrink-0">2</span>
            <span>
              <strong>Streaming</strong> &mdash; each distribution moves one
              lattice cell along its velocity direction (D2Q9: 9 directions).
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-mono text-mc-dark font-semibold shrink-0">3</span>
            <span>
              <strong>Bounce-back</strong> &mdash; distributions hitting solid
              barriers reverse direction, creating no-slip walls.
            </span>
          </li>
        </ul>
        <p>
          The Reynolds number Re = U&middot;L / &nu; determines the flow regime.
          Low Re gives smooth laminar flow; higher values produce vortex
          shedding and turbulence. Try reducing viscosity with the Cylinder
          preset to see a von K&aacute;rm&aacute;n vortex street emerge.
        </p>
      </div>
    </div>
  );
}
