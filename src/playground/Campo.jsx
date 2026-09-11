import React from "react";
import { COLORS } from "../theme.js";

// Envelope padrão de um campo: rótulo, controle, dica e mensagem de erro.
//
// A mensagem de erro é ligada ao controle por `aria-describedby` e o campo
// inválido recebe `aria-invalid` — é o que permite testar acessibilidade de
// verdade, e não só a cor vermelha.
export default function Campo({ id, rotulo, obrigatorio, erro, dica, children }) {
  const idErro = `${id}-erro`;
  const idDica = `${id}-dica`;
  const descritores = [erro ? idErro : null, dica ? idDica : null].filter(Boolean).join(" ");

  return (
    <div className="qa-field">
      <label className="qa-label" htmlFor={id}>
        {rotulo}
        {obrigatorio && (
          <span aria-hidden="true" style={{ color: COLORS.accent, marginLeft: 4 }}>
            *
          </span>
        )}
      </label>

      {children({
        id,
        "aria-invalid": erro ? "true" : undefined,
        "aria-describedby": descritores || undefined,
      })}

      {dica && (
        <span className="qa-hint" id={idDica}>
          {dica}
        </span>
      )}
      {erro && (
        <span className="qa-erro" id={idErro} role="alert" data-testid={`${id}-erro`}>
          {erro}
        </span>
      )}
    </div>
  );
}
