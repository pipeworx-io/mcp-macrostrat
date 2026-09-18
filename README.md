# mcp-macrostrat

Macrostrat MCP — geologic map / column / unit data for North America and beyond.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1476+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `find_units` | Find geologic rock units from Macrostrat by location + age, by stratigraphic name, or by lithology. Provide lat+lng (optionally with age in millions of years, Ma), or a strat_name (e.g. "Hell Creek"), or a lith (e.g. "granite"). Returns units with formation/group, stratigraphic column, bottom/top ages (Ma) and time intervals, lithology, and max thickness. Keyless. North America and beyond. |
| `find_columns` | List Macrostrat stratigraphic columns near a geographic point. Provide lat and lng (decimal degrees). Returns the columns covering that location with column name, regional group, coordinates, unit count, and area. Keyless. |
| `define_lithology` | Look up Macrostrat lithology definitions by name (e.g. "granite", "limestone") returning lith_id, name, type, group, and class; omit lith to list all lithologies (capped at 50 results).Returns lithology id, name, type, group, and class. Keyless. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "macrostrat": {
      "url": "https://gateway.pipeworx.io/macrostrat/mcp"
    }
  }
}
```

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/macrostrat/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1476+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Macrostrat data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT

## No MCP client? Call it over HTTP

```bash
curl -X POST https://gateway.pipeworx.io/v1/tools/find_units \
  -H 'Content-Type: application/json' \
  -d '{"lat":40.8071,"lng":-104.9901}'
```

No account needed for the first calls. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/find_units`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.
