# odh-jupyter-pvc-alerts

A JupyterLab 4 extension that warns users when the filesystem backing their
notebook PVC is almost full. Includes a Python server extension and a prebuilt
TypeScript frontend. No Kubernetes credentials, API access, or additional RBAC
permissions are required.

## Behavior

- Checks storage after JupyterLab starts, then every **60 seconds** by default.
- Shows a persistent JupyterLab warning at **90% usage** or higher, including
  the percentage used and available space in readable units.
- Offers **How to free up space** for cleanup advice and the storage location.
  Opening this help does not dismiss the warning or change any files.
- Updates one notification instead of adding another on each check. Dismissing
  it silences the current high-usage episode until usage recovers. Reloading the
  page or changing settings starts a fresh check.
- Clears the warning when usage drops below the threshold or alerts are disabled.
- Checks run only while the JupyterLab page is open. Each browser tab polls
  independently; these are in-app alerts, not email or cluster-wide alerts.
- Failed checks are retried at the configured interval. Details are logged on
  the server and a warning is logged in the browser console once per failure
  episode. Invalid API responses are treated as failed checks. A failed check
  is **not** interpreted as healthy storage and does not clear an existing warning.
- Does not delete files, resize PVCs, or scan directory contents.

## Installation from this repository

Use a development environment with Python 3.9+ and JupyterLab 4:

```bash
# From the repository root
python -m pip install 'jupyterlab>=4,<5'
jlpm install
cd odh-jupyter-pvc-alerts
python -m pip install -e '.[test]'
jupyter labextension develop . --overwrite
jupyter server extension enable odh_jupyter_pvc_alerts
```

Restart JupyterLab after installation. The package is not yet published to PyPI.
For notebook images, build a wheel with `python -m build` from this directory and
install it into the Python environment running Jupyter Server. The wheel includes
both the frontend and server auto-enable configuration.

## Select the notebook PVC (administrator setting)

The extension monitors one filesystem. Configure an existing absolute path on
the PVC as seen **inside the notebook container**, not a PVC resource name:

```bash
export ODH_PVC_MOUNT_PATH=/opt/app-root/src
jupyter lab
```

Alternatively, in `jupyter_server_config.py`:

```python
c.PVCAlertsConfig.mount_path = '/opt/app-root/src'
```

Precedence: `PVCAlertsConfig.mount_path` → `ODH_PVC_MOUNT_PATH` →
`ServerApp.root_dir`. Explicit server configuration overrides the environment;
an explicitly empty path selects the notebook root. `~` is expanded. Restart
Jupyter Server after changing the path.

The default works when the notebook root is on the PVC. If your notebook root is
on the container's writable layer, set the PVC mount path explicitly. The API
never accepts client-selected paths. Missing, inaccessible, or zero-capacity
filesystems return HTTP 503 rather than falling back to a different filesystem.

## User settings

Open **Settings → Settings Editor → Notebook Storage Alerts** in JupyterLab.
The settings explain their units and allowed values; no PVC or Kubernetes
knowledge is needed.

- **Show storage warnings** turns checks on or off. Turning it off does not
  free up space or change your files.
- **Warn when storage usage reaches (%)** controls how early you are warned.
  For example, `80` warns when about 20% of usable space remains.
- **Check storage every (seconds)** controls how often usage is checked.
  For example, `300` checks about every five minutes.

The same settings are available as JSON (the keys have not changed):

```json
{
  "enabled": true,
  "warningThreshold": 90,
  "pollInterval": 60
}
```

| Setting            | Default | Allowed values   |
| ------------------ | ------- | ---------------- |
| `enabled`          | `true`  | Boolean          |
| `warningThreshold` | `90`    | 1–100 percent    |
| `pollInterval`     | `60`    | 10–86400 seconds |

Changes take effect immediately. Administrators can provide deployment defaults
using the standard JupyterLab `overrides.json` settings mechanism under plugin ID
`odh-jupyter-pvc-alerts:plugin`.

### When you see a warning

For example:

> Notebook storage: 95% used (5 GiB available). Free up space to avoid problems saving your work.

Choose **How to free up space** for details. Remove only files you no longer
need, and keep a copy of anything important before emptying the Trash: that
step permanently deletes its contents. If you need to keep your files, ask
your administrator whether more storage is available. The extension does not
resize storage or delete files for you.

Small amounts of available space are shown in bytes, KiB, or MiB rather than
rounded down to `0.00 GiB`. These are binary units: 1 GiB is 1024 MiB.
The alert clears on the next successful check below your chosen usage level.
Dismissing it does not free up space or disable checks; see **Behavior** above
for when another warning may appear.

## Localization

The warning, notification action, cleanup dialog, and settings descriptions use
JupyterLab's translation infrastructure with the domain
`odh_jupyter_pvc_alerts`. They use the active JupyterLab language when a language
pack provides translations for this domain, and fall back to English otherwise.
This extension does not currently ship language catalogs of its own.
Numbers retain browser-locale formatting; byte labels use translated plural
rules, while binary unit symbols such as KiB and GiB remain unchanged.

For contributors adding catalogs:

- Extract frontend messages from `src/` (`__` and `_n` calls) and settings
  messages from `schema/plugin.json` using JupyterLab's translation tooling
  ([jupyterlab-translate](https://github.com/jupyterlab/jupyterlab-translate)).
- Preserve numbered placeholders such as `%1` and `%2`; translators may reorder
  them. For byte plurals, `%1` is the raw count supplied by `_n` and `%2` is the
  locale-formatted count.
- The schema declares `jupyter.lab.internationalization.domain`; Jupyter Server
  translates its title/description with the `schema` context and property
  titles/descriptions with the `settings` context. Do not translate settings
  keys or the plugin ID.
- Keep complete messages translatable rather than concatenating translated
  sentence fragments. Diagnostic console/server logs remain in English.

## Capacity semantics and limitations

The server calls `os.statvfs()` in a worker thread. Like `df`, the usage percentage
is `used / (used + available-to-unprivileged-users) * 100`, so filesystem-reserved
blocks are accounted for. `totalBytes` includes those reserved blocks; therefore
`usedBytes + availableBytes` can be less than `totalBytes`.

This measures the **filesystem containing the configured path**, not the size of
that directory or the Kubernetes PVC's requested capacity. Shared NFS volumes,
PVC subdirectories, and storage-driver quotas may expose the underlying
filesystem's capacity rather than an individual claim's quota. Verify the
reported values with `df` inside the notebook container for your storage class.
The path must stay mounted; if a mount disappears but its directory remains,
filesystem statistics can describe the parent filesystem instead.

This initial version monitors byte capacity only, not inode exhaustion, multiple
PVCs, or Kubernetes storage metrics. Browser timer throttling and slow storage
can delay checks; this is advisory monitoring, not an out-of-space guarantee.

## API

Authenticated read-only endpoint (relative to Jupyter Server's base URL):

```text
GET /odh-jupyter-pvc-alerts/usage
```

Returns `path`, `totalBytes`, `usedBytes`, `availableBytes`, and `usagePercent`.
Responses are not cached. Errors return a generic message, with detailed
filesystem errors kept in server logs.

## Development and tests

```bash
# From this directory
jlpm build
jlpm test
python -m pytest --cov odh_jupyter_pvc_alerts

# From the repository root
make EXTENSION=odh-jupyter-pvc-alerts lint
make EXTENSION=odh-jupyter-pvc-alerts ui-tests-setup
make EXTENSION=odh-jupyter-pvc-alerts ui-tests
```

Python tests cover filesystem statistics, configuration precedence, authenticated
API access, non-root server URLs, background-thread reads, and storage errors.
Jest tests cover API response validation, polling, notification deduplication,
recovery, settings changes, and startup/shutdown races.
Galata browser tests simulate usage responses without filling a real PVC.

## License

Apache-2.0. See [LICENSE](LICENSE).
