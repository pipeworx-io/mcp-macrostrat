# mcp-macrostrat

Macrostrat MCP — geologic map / column / unit data for North America and beyond.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

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

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Macrostrat data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
