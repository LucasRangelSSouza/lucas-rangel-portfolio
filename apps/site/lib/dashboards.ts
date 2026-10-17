const bi = process.env.NEXT_PUBLIC_BI_URL || "";

function publicUrl(uuid: string | undefined) {
  return bi && uuid ? `${bi.replace(/\/$/, "")}/public/dashboard/${uuid}` : undefined;
}

export const dashboards = {
  pncp: publicUrl(process.env.NEXT_PUBLIC_PNCP_DASH_UUID),
  siope: publicUrl(process.env.NEXT_PUBLIC_SIOPE_DASH_UUID),
  login: bi || undefined,
};
