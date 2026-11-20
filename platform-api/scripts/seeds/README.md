# Seeds

Seeds are grouped by subject; their npm commands remain in `platform-api/package.json`.

- `demo/`: local demonstration accounts (`npm run seed`).
- `classroom/`: classroom and learning activity catalog (`npm run seed:classroom:preview` or `npm run seed:classroom`).
- `cefet/`: student roster parsing and Microsoft Graph enrollment seed; the operator supplies the roster file.
- `python/`: Python exercise seeding and the Pandas examples (`npm run seed:pandas-examples`). CSV fixtures in `python/data/pandas/` are uploaded to template storage by the seeder.
- `teraorm/`: TeraORM study exercises (`npm run seed:teraorm-study`).

Operational and one-off scripts remain in `scripts/`, including migration helpers and performance diagnostics. Review each script's target and side effects before running it.
