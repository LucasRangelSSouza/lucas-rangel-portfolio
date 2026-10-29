// Os valores padrão são públicos (link público do Metabase) e entram no build estático; sem eles o iframe ficava vazio.
const bi = process.env.NEXT_PUBLIC_BI_URL || "https://bi.rangeltech.net";

function publicUrl(uuid: string | undefined) {
  return bi && uuid ? `${bi.replace(/\/$/, "")}/public/dashboard/${uuid}` : undefined;
}

export const dashboards = {
  pncp: publicUrl(process.env.NEXT_PUBLIC_PNCP_DASH_UUID || "ba8bf0b4-c6f5-465b-be1d-009e0f344e83"),
  siope: publicUrl(process.env.NEXT_PUBLIC_SIOPE_DASH_UUID || "b3908bb7-a29b-4d8b-8a56-0c1240a43e5a"),
  login: bi || undefined,
};
