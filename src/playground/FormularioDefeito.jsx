import React, { useState } from "react";
import Campo from "./Campo.jsx";
import { COLORS } from "../theme.js";
import { SEVERIDADES, PRIORIDADES, AMBIENTES, MODULOS } from "./dominio.js";
import { validarDefeito, LIMITES } from "./validacao.js";

export const VALORES_INICIAIS = {
  titulo: "",
  modulo: "",
  severidade: "",
  prioridade: "",
  ambiente: "",
  reporter: "",
  data: "",
  ocorrencias: "",
  passos: "",
  aceite: false,
};

// Formulário de registro de defeito do sistema fake.
//
// Comportamento pensado para quem está treinando teste manual:
//  • a validação roda no envio e, a partir daí, a cada digitação do campo
//    corrigido (o clássico "validate on submit, then on change");
//  • o foco vai para o primeiro campo com erro — comportamento de
//    acessibilidade que vale testar;
//  • o contador de caracteres mostra os limites, dando fronteiras claras para
//    exercícios de valor-limite.
export default function FormularioDefeito({ onRegistrar }) {
  const [valores, setValores] = useState(VALORES_INICIAIS);
  const [erros, setErros] = useState({});
  const [enviado, setEnviado] = useState(false);

  const alterar = (campo) => (e) => {
    const valor = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    const proximos = { ...valores, [campo]: valor };
    setValores(proximos);
    if (enviado) setErros(validarDefeito(proximos));
  };

  const enviar = (e) => {
    e.preventDefault();
    setEnviado(true);
    const achados = validarDefeito(valores);
    setErros(achados);

    const chaves = Object.keys(achados);
    if (chaves.length > 0) {
      const alvo = document.getElementById(`campo-${chaves[0]}`);
      alvo?.focus();
      return;
    }

    onRegistrar({
      ...valores,
      titulo: valores.titulo.trim(),
      reporter: valores.reporter.trim(),
      passos: valores.passos.trim(),
      ocorrencias: Number(valores.ocorrencias),
    });
    setValores(VALORES_INICIAIS);
    setErros({});
    setEnviado(false);
  };

  const limpar = () => {
    setValores(VALORES_INICIAIS);
    setErros({});
    setEnviado(false);
  };

  const totalErros = Object.keys(erros).length;

  return (
    <form onSubmit={enviar} noValidate data-testid="formulario-defeito" className="qa-card" style={{ padding: "26px 26px 24px" }}>
      <h3 className="qa-display" style={{ fontSize: 26, fontWeight: 700, margin: "0 0 4px", color: COLORS.text }}>
        Registrar defeito
      </h3>
      <p style={{ fontSize: 14, color: COLORS.muted, margin: "0 0 22px", lineHeight: 1.55 }}>
        Todos os campos marcados com <span style={{ color: COLORS.accent }}>*</span> são obrigatórios.
        As regras de validação estão descritas nos cenários da aba ao lado.
      </p>

      {/* Resumo de erros — o "sumário de validação" que leitores de tela anunciam */}
      {enviado && totalErros > 0 && (
        <div
          role="alert"
          data-testid="resumo-erros"
          style={{
            marginBottom: 20,
            padding: "12px 16px",
            borderRadius: 10,
            background: "rgba(255,107,107,.12)",
            borderLeft: `4px solid ${COLORS.erro}`,
            color: COLORS.erro,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {totalErros === 1
            ? "1 campo precisa de atenção antes de registrar."
            : `${totalErros} campos precisam de atenção antes de registrar.`}
        </div>
      )}

      <div className="qa-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <Campo
            id="campo-titulo"
            rotulo="Título do defeito"
            obrigatorio
            erro={erros.titulo}
            dica={`De ${LIMITES.tituloMin} a ${LIMITES.tituloMax} caracteres — ${valores.titulo.length} digitados.`}
          >
            {(props) => (
              <input
                {...props}
                className="qa-input"
                type="text"
                name="titulo"
                data-testid="input-titulo"
                value={valores.titulo}
                onChange={alterar("titulo")}
                placeholder="Ex.: Botão Salvar não responde no Safari"
              />
            )}
          </Campo>
        </div>

        <Campo id="campo-modulo" rotulo="Módulo afetado" obrigatorio erro={erros.modulo}>
          {(props) => (
            <select {...props} className="qa-select" name="modulo" data-testid="select-modulo" value={valores.modulo} onChange={alterar("modulo")}>
              <option value="">Selecione…</option>
              {MODULOS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          )}
        </Campo>

        <Campo id="campo-severidade" rotulo="Severidade" obrigatorio erro={erros.severidade}>
          {(props) => (
            <select {...props} className="qa-select" name="severidade" data-testid="select-severidade" value={valores.severidade} onChange={alterar("severidade")}>
              <option value="">Selecione…</option>
              {SEVERIDADES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
        </Campo>

        <Campo id="campo-ambiente" rotulo="Ambiente" obrigatorio erro={erros.ambiente}>
          {(props) => (
            <select {...props} className="qa-select" name="ambiente" data-testid="select-ambiente" value={valores.ambiente} onChange={alterar("ambiente")}>
              <option value="">Selecione…</option>
              {AMBIENTES.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          )}
        </Campo>

        <Campo id="campo-reporter" rotulo="E-mail de quem reportou" obrigatorio erro={erros.reporter} dica="Formato nome@dominio.com">
          {(props) => (
            <input
              {...props}
              className="qa-input"
              type="email"
              name="reporter"
              data-testid="input-reporter"
              value={valores.reporter}
              onChange={alterar("reporter")}
              placeholder="voce@empresa.com"
            />
          )}
        </Campo>

        <Campo id="campo-data" rotulo="Data de detecção" obrigatorio erro={erros.data} dica="Não pode estar no futuro.">
          {(props) => (
            <input
              {...props}
              className="qa-input"
              type="date"
              name="data"
              data-testid="input-data"
              value={valores.data}
              onChange={alterar("data")}
            />
          )}
        </Campo>

        <Campo
          id="campo-ocorrencias"
          rotulo="Ocorrências"
          obrigatorio
          erro={erros.ocorrencias}
          dica={`Número inteiro de ${LIMITES.ocorrenciasMin} a ${LIMITES.ocorrenciasMax}.`}
        >
          {(props) => (
            <input
              {...props}
              className="qa-input"
              type="number"
              name="ocorrencias"
              data-testid="input-ocorrencias"
              value={valores.ocorrencias}
              onChange={alterar("ocorrencias")}
              placeholder="1"
            />
          )}
        </Campo>

        {/* Prioridade em rádio: o grupo precisa de fieldset/legend para ser
            anunciado corretamente por leitores de tela. */}
        <fieldset
          style={{ gridColumn: "1 / -1", border: "none", padding: 0, margin: 0 }}
          data-testid="grupo-prioridade"
          aria-describedby={erros.prioridade ? "campo-prioridade-erro" : undefined}
        >
          <legend className="qa-label" style={{ padding: 0, marginBottom: 8 }}>
            Prioridade <span aria-hidden="true" style={{ color: COLORS.accent }}>*</span>
          </legend>
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
            {PRIORIDADES.map((p, i) => (
              <label key={p} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 14.5, color: COLORS.textSoft, cursor: "pointer" }}>
                <input
                  type="radio"
                  name="prioridade"
                  id={i === 0 ? "campo-prioridade" : undefined}
                  value={p}
                  data-testid={`radio-prioridade-${p}`}
                  checked={valores.prioridade === p}
                  onChange={alterar("prioridade")}
                  style={{ accentColor: COLORS.accent, width: 17, height: 17 }}
                />
                {p}
                <span style={{ color: COLORS.muted, fontSize: 13 }}>
                  {p === "P1" ? "· imediata" : p === "P2" ? "· próxima sprint" : "· backlog"}
                </span>
              </label>
            ))}
          </div>
          {erros.prioridade && (
            <span className="qa-erro" id="campo-prioridade-erro" role="alert" data-testid="campo-prioridade-erro" style={{ marginTop: 6, display: "block" }}>
              {erros.prioridade}
            </span>
          )}
        </fieldset>

        <div style={{ gridColumn: "1 / -1" }}>
          <Campo
            id="campo-passos"
            rotulo="Passos para reproduzir"
            obrigatorio
            erro={erros.passos}
            dica={`Mínimo de ${LIMITES.passosMin} caracteres — ${valores.passos.length} digitados.`}
          >
            {(props) => (
              <textarea
                {...props}
                className="qa-textarea"
                name="passos"
                data-testid="input-passos"
                value={valores.passos}
                onChange={alterar("passos")}
                placeholder={"1. Acessar a tela X\n2. Preencher o campo Y\n3. Observar o resultado Z"}
              />
            )}
          </Campo>
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14.5, color: COLORS.textSoft, cursor: "pointer", lineHeight: 1.5 }}>
            <input
              type="checkbox"
              id="campo-aceite"
              name="aceite"
              data-testid="check-aceite"
              checked={valores.aceite}
              onChange={alterar("aceite")}
              aria-invalid={erros.aceite ? "true" : undefined}
              aria-describedby={erros.aceite ? "campo-aceite-erro" : undefined}
              style={{ accentColor: COLORS.accent, width: 18, height: 18, marginTop: 2, flexShrink: 0 }}
            />
            <span>
              Confirmo que este relato não contém token, senha, URL interna, dado de cliente
              ou qualquer informação sensível do meu empregador.
            </span>
          </label>
          {erros.aceite && (
            <span className="qa-erro" id="campo-aceite-erro" role="alert" data-testid="campo-aceite-erro" style={{ marginTop: 6, display: "block" }}>
              {erros.aceite}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 24 }}>
        <button type="submit" className="qa-btn qa-btn-primario" data-testid="btn-registrar">
          Registrar defeito
        </button>
        <button
          type="button"
          className="qa-btn"
          onClick={limpar}
          data-testid="btn-limpar"
          style={{ background: COLORS.surfaceAlt, color: COLORS.text }}
        >
          Limpar formulário
        </button>
      </div>
    </form>
  );
}
