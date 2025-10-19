import * as fs from 'fs'
import * as path from 'path'

export interface ProvenanceWorkflowInfo {
  file: string
  hasIdTokenWrite: boolean
  hasProvenanceFlag: boolean
  publishCommands: string[]
}

export interface ProvenanceData {
  packageJsonPath?: string
  packageName?: string
  publishConfigProvenance?: boolean
  workflowsDir?: string
  workflows: ProvenanceWorkflowInfo[]
  ciHasIdTokenWrite: boolean
  ciUsesProvenanceFlag: boolean
  enabled: boolean
}

function safeReadJson(filePath: string): any | undefined {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (_) {
    return undefined
  }
}

function findUp(
  startDir: string,
  matcher: (dir: string) => string | undefined
): string | undefined {
  let current = startDir
  // Walk up until filesystem root
  while (true) {
    const match = matcher(current)
    if (match && fs.existsSync(match)) return match
    const parent = path.dirname(current)
    if (parent === current) return undefined
    current = parent
  }
}

function findNearestPackageJson(startDir: string): string | undefined {
  return findUp(startDir, (dir) => {
    const p = path.join(dir, 'package.json')
    return fs.existsSync(p) ? p : undefined
  })
}

function findWorkflowsDir(startDir: string): string | undefined {
  return findUp(startDir, (dir) => {
    const gh = path.join(dir, '.github', 'workflows')
    return fs.existsSync(gh) ? gh : undefined
  })
}

function scanWorkflows(workflowsDir: string): ProvenanceWorkflowInfo[] {
  const results: ProvenanceWorkflowInfo[] = []
  const files = fs.existsSync(workflowsDir) ? fs.readdirSync(workflowsDir) : []
  for (const file of files) {
    if (!file.endsWith('.yml') && !file.endsWith('.yaml')) continue
    const abs = path.join(workflowsDir, file)
    const content = fs.readFileSync(abs, 'utf8')
    const hasIdTokenWrite = /id-token\s*:\s*write/.test(content)
    const hasProvenanceFlag = /--provenance(\s|$)/.test(content)
    const publishCommands: string[] = []
    for (const line of content.split(/\r?\n/)) {
      if (/\bpublish\b/.test(line)) publishCommands.push(line.trim())
    }
    results.push({
      file: abs,
      hasIdTokenWrite,
      hasProvenanceFlag,
      publishCommands
    })
  }
  return results
}

export function getProvenanceData({
  manifestPath
}: {
  manifestPath: string
}): ProvenanceData {
  const projectDir = path.dirname(manifestPath)

  const packageJsonPath = findNearestPackageJson(projectDir)
  const pkg = packageJsonPath ? safeReadJson(packageJsonPath) : undefined
  const publishConfigProvenance: boolean | undefined =
    pkg?.publishConfig?.provenance
  const packageName: string | undefined = pkg?.name

  const workflowsDir = findWorkflowsDir(projectDir)
  const workflows = workflowsDir ? scanWorkflows(workflowsDir) : []

  const ciHasIdTokenWrite = workflows.some((w) => w.hasIdTokenWrite)
  const ciUsesProvenanceFlag = workflows.some((w) => w.hasProvenanceFlag)

  const enabled = Boolean(
    publishConfigProvenance && ciHasIdTokenWrite && ciUsesProvenanceFlag
  )

  return {
    packageJsonPath,
    packageName,
    publishConfigProvenance,
    workflowsDir,
    workflows,
    ciHasIdTokenWrite,
    ciUsesProvenanceFlag,
    enabled
  }
}
