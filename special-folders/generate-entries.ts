import * as fs from 'fs'
import * as path from 'path'

export function scanFilesInFolder (
  dirPath: string,
  filter: (name: string) => boolean
): string[] {
  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
    return []
  }

  const files: string[] = []

  function recurse (currentPath: string) {
    const entries = fs.readdirSync(currentPath, {withFileTypes: true})

    for (const entry of entries) {
      const entryPath = path.join(currentPath, entry.name)

      if (entry.isDirectory()) {
        recurse(entryPath)
      } else if (entry.isFile() && filter(entry.name)) {
        files.push(entryPath)
      }
    }
  }

  recurse(dirPath)

  return files
}

type IncludeList = Record<string, string>

export function generateEntries (
  projectPath: string,
  includes: string[] | undefined,
  folderName: string = ''
): IncludeList {
  if (!includes || !includes.length) return {}

  return includes.reduce((acc, include) => {
    const extname = path.extname(include)

    // pages/ and scripts/ both keep their nesting: keying by basename alone
    // makes scripts/a/inject.js and scripts/b/inject.js the same entry, and
    // the last one scanned silently replaces the other.
    if (folderName === 'pages' || folderName === 'scripts') {
      const folderRoot = path.join(projectPath, folderName)
      // Relative path inside the folder, normalized to unix style
      const rel = path.relative(folderRoot, include).split(path.sep).join('/')

      // Strip extension
      let relNoExt = rel.slice(0, -extname.length)

      // Collapse nested "/index" -> its parent, a pages/ routing convention.
      // A script named index.js is a file, not a route, so it keeps its name.
      // Root "index" remains "index"
      if (folderName === 'pages' && relNoExt.endsWith('/index')) {
        relNoExt = relNoExt.slice(0, -'/index'.length)
      }

      if (relNoExt === '') {
        relNoExt = 'index'
      }

      const key = `${folderName}/${relNoExt}`

      return {...acc, [key]: include}
    }

    // Default behavior (public/, etc...)
    const filename = path.basename(include, extname)
    const key = folderName
      ? `${folderName}/${filename}`
      : path.relative(projectPath, include)

    return {
      ...acc,
      [key]: include
    }
  }, {})
}
