interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Macrostrat MCP — geologic map / column / unit data for North America and beyond.
 *
 * Wraps the keyless Macrostrat API (https://macrostrat.org/api). Find rock units by
 * location + age or stratigraphic name, list stratigraphic columns near a point, and
 * look up lithology definitions. Geologic ages are in millions of years (Ma). Keyless.
 */


const BASE = 'https://macrostrat.org/api';
const UA = 'pipeworx/1.0 (+https://pipeworx.io)';

const tools: McpToolExport['tools'] = [
  {
    name: 'find_units',
    description:
      'Find geologic rock units from Macrostrat by location + age, by stratigraphic name, or by lithology. ' +
      'Provide lat+lng (optionally with age in millions of years, Ma), or a strat_name (e.g. "Hell Creek"), or a lith (e.g. "granite"). ' +
      'Returns units with formation/group, stratigraphic column, bottom/top ages (Ma) and time intervals, lithology, and max thickness. Keyless. North America and beyond.',
    inputSchema: {
      type: 'object',
      properties: {
        lat: { type: 'number', description: 'Latitude (decimal degrees). Must be paired with lng.' },
        lng: { type: 'number', description: 'Longitude (decimal degrees). Must be paired with lat.' },
        age: { type: 'number', description: 'Geologic age in millions of years (Ma). Optional; used with lat+lng.' },
        strat_name: { type: 'string', description: 'Stratigraphic name to match, e.g. "Hell Creek".' },
        lith: { type: 'string', description: 'Lithology to match, e.g. "granite", "sandstone".' },
        limit: { type: 'number', description: 'Max units to return (default 20).' },
      },
    },
  },
  {
    name: 'find_columns',
    description:
      'List Macrostrat stratigraphic columns near a geographic point. Provide lat and lng (decimal degrees). ' +
      'Returns the columns covering that location with column name, regional group, coordinates, unit count, and area. Keyless.',
    inputSchema: {
      type: 'object',
      properties: {
        lat: { type: 'number', description: 'Latitude (decimal degrees).' },
        lng: { type: 'number', description: 'Longitude (decimal degrees).' },
      },
      required: ['lat', 'lng'],
    },
  },
  {
    name: 'define_lithology',
    description:
      'Look up Macrostrat lithology definitions. Provide a lith name (e.g. "granite", "limestone") to match, or omit to list all lithologies (capped at 50). ' +
      'Returns lithology id, name, type, group, and class. Keyless.',
    inputSchema: {
      type: 'object',
      properties: {
        lith: { type: 'string', description: 'Lithology name to match, e.g. "granite". Omit to list all.' },
      },
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  try {
    switch (name) {
      case 'find_units':
        return await findUnits(args);
      case 'find_columns':
        return await findColumns(args);
      case 'define_lithology':
        return await defineLithology(args);
      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

async function macrostratGet(path: string): Promise<any[]> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: 'application/json', 'User-Agent': UA },
  });
  if (!res.ok) {
    throw new Error(`Macrostrat: ${res.status} ${(await res.text()).slice(0, 200)}`);
  }
  const json = (await res.json()) as any;
  const data = json?.success?.data;
  return Array.isArray(data) ? data : [];
}

function num(v: unknown): number | undefined {
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
  return undefined;
}

/** Normalize the `lith` field, which may be an array of objects, a string, or absent. */
function normalizeLith(lith: unknown): string | undefined {
  if (Array.isArray(lith)) {
    const names = Array.from(
      new Set(
        lith
          .map((l) => (l && typeof l === 'object' ? (l as any).name : l))
          .filter((n): n is string => typeof n === 'string' && n.trim() !== ''),
      ),
    );
    return names.length ? names.join(', ') : undefined;
  }
  if (typeof lith === 'string') return lith || undefined;
  return undefined;
}

async function findUnits(args: Record<string, unknown>): Promise<unknown> {
  const lat = num(args.lat);
  const lng = num(args.lng);
  const age = num(args.age);
  const stratName = typeof args.strat_name === 'string' ? args.strat_name.trim() : '';
  const lith = typeof args.lith === 'string' ? args.lith.trim() : '';
  const limit = num(args.limit) ?? 20;

  const hasLatLng = lat !== undefined && lng !== undefined;
  if (!hasLatLng && !stratName && !lith) {
    return { error: 'provide lat+lng, strat_name, or lith' };
  }

  const params = new URLSearchParams();
  if (hasLatLng) {
    params.set('lat', String(lat));
    params.set('lng', String(lng));
    if (age !== undefined) params.set('age', String(age));
  }
  if (stratName) params.set('strat_name', stratName);
  if (lith) params.set('lith', lith);
  // response=long returns lithology, time intervals, and color fields per unit.
  params.set('response', 'long');

  const data = await macrostratGet(`/units?${params.toString()}`);
  const units = data.slice(0, limit).map((u: any) => ({
    unit_id: u.unit_id,
    strat_name: u.strat_name ?? u.unit_name ?? u.strat_name_long,
    formation: u.Fm,
    group: u.Gp,
    column: u.col_name,
    col_id: u.col_id,
    b_age: u.b_age,
    t_age: u.t_age,
    b_interval: u.b_int_name,
    t_interval: u.t_int_name,
    lith: normalizeLith(u.lith),
    max_thick: u.max_thick,
  }));
  return { count: units.length, units };
}

async function findColumns(args: Record<string, unknown>): Promise<unknown> {
  const lat = num(args.lat);
  const lng = num(args.lng);
  if (lat === undefined || lng === undefined) {
    return { error: 'lat and lng are required' };
  }
  const params = new URLSearchParams();
  params.set('lat', String(lat));
  params.set('lng', String(lng));

  const data = await macrostratGet(`/columns?${params.toString()}`);
  const columns = data.map((c: any) => ({
    col_id: c.col_id,
    col_name: c.col_name,
    group: c.col_group ?? c.group,
    lat: num(c.lat) ?? c.lat,
    lng: num(c.lng) ?? c.lng,
    units: c.t_units,
    area: c.col_area ?? c.area,
  }));
  return { count: columns.length, columns };
}

async function defineLithology(args: Record<string, unknown>): Promise<unknown> {
  const lith = typeof args.lith === 'string' ? args.lith.trim() : '';
  const query = lith ? `lith=${encodeURIComponent(lith)}` : 'all';
  const data = await macrostratGet(`/defs/lithologies?${query}`);
  const sliced = lith ? data : data.slice(0, 50);
  const lithologies = sliced.map((l: any) => ({
    lith_id: l.lith_id,
    name: l.name,
    type: l.type,
    group: l.group,
    class: l.class,
  }));
  return { count: lithologies.length, lithologies };
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
