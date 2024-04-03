import cp from "node:child_process"
import fs from "node:fs/promises"
import fspath from "node:path"
import chokidar from "chokidar"

/**
 * 🤘🏻 Pretty pumped about this hack!!! 🤘🏻
 * With Ableton Live open and this running, saving shows XML diff
 */

const dir = await fs.realpath(process.env.ALS_DIR || `${process.env.HOME}/Documents/Ableton`)

const watcher = chokidar
  .watch(`${dir}/**/*.als`, { ignored: /\/Backup\// })
  .on("ready", () => console.log(`Watching for Ableton changes in ${dir} ...`))

  // First time, gunzip and store first version
  .on("add", (path) => run(`cat ${path} | gunzip > /tmp/${fspath.basename(path)}.xml`))

  // Listen for fs events, gunzip and diff new version
  .on("change", (path) => {
    const f = fspath.basename(path)
    run(`
        cat ${path} | gunzip > /tmp/n${f}.xml ; cd /tmp
        git diff --minimal --color=always ${f}.xml n${f}.xml | tail -n +5 ; mv n${f}.xml ${f}.xml
      `)
  })

const run = (cmd: string) =>
  cp.exec(cmd, { shell: "bash" }, (err, stdout, stderr) => {
    if (err || stderr) console.error(err, stdout, stderr)
    else if (stdout?.trim()) console.log(stdout.trim())
  })
