import { describe, it, expect } from "vitest";
import {
  enviadoTemplate,
  aprobadoTemplate,
  devueltoTemplate,
  buildTemplate,
  statusToNotificationType,
  type TemplateData,
} from "./templates";

const baseData: TemplateData = {
  piacNombre: "Fundamentos de la Educación",
  docenteNombre: "María Pérez",
  programa: "Pedagogía en Historia",
  piacUrl: "https://umce.online/piac?id=abc-123",
};

describe("statusToNotificationType", () => {
  it("maps enviado", () => {
    expect(statusToNotificationType("enviado")).toBe("enviado");
  });
  it("maps aprobado", () => {
    expect(statusToNotificationType("aprobado")).toBe("aprobado");
  });
  it("maps devuelto", () => {
    expect(statusToNotificationType("devuelto")).toBe("devuelto");
  });
  it("returns null for borrador", () => {
    expect(statusToNotificationType("borrador")).toBeNull();
  });
  it("returns null for en_revision", () => {
    expect(statusToNotificationType("en_revision")).toBeNull();
  });
});

describe("enviadoTemplate", () => {
  it("includes PIAC name in subject", () => {
    const { subject } = enviadoTemplate(baseData);
    expect(subject).toContain("Fundamentos de la Educación");
  });
  it("includes docente name and PIAC link in HTML", () => {
    const { html } = enviadoTemplate(baseData);
    expect(html).toContain("María Pérez");
    expect(html).toContain("https://umce.online/piac?id=abc-123");
  });
  it("contains UMCE Online branding", () => {
    const { html } = enviadoTemplate(baseData);
    expect(html).toContain("UMCE Online");
  });
});

describe("aprobadoTemplate", () => {
  it("includes 'aprobado' in subject and html", () => {
    const { subject, html } = aprobadoTemplate(baseData);
    expect(subject).toMatch(/aprobado/i);
    expect(html).toContain("aprobado");
  });
  it("includes programa", () => {
    const { html } = aprobadoTemplate(baseData);
    expect(html).toContain("Pedagogía en Historia");
  });
});

describe("devueltoTemplate", () => {
  it("includes comment when provided", () => {
    const { html } = devueltoTemplate({
      ...baseData,
      comentario: "Falta bibliografía complementaria",
    });
    expect(html).toContain("Falta bibliografía complementaria");
    expect(html).toContain("Comentario de la DI");
  });
  it("omits comment block when no comment", () => {
    const { html } = devueltoTemplate(baseData);
    expect(html).not.toContain("Comentario de la DI");
  });
  it("converts newlines to <br> in comment", () => {
    const { html } = devueltoTemplate({
      ...baseData,
      comentario: "Línea 1\nLínea 2",
    });
    expect(html).toContain("Línea 1<br>Línea 2");
  });
});

describe("buildTemplate", () => {
  it("dispatches to correct template", () => {
    const enviado = buildTemplate("enviado", baseData);
    expect(enviado.subject).toContain("enviado");

    const aprobado = buildTemplate("aprobado", baseData);
    expect(aprobado.subject).toContain("aprobado");

    const devuelto = buildTemplate("devuelto", baseData);
    expect(devuelto.subject).toContain("devuelto");
  });
});
