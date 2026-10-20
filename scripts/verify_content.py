"""Corre cada reto con el mismo arnés que usa el navegador (src/engine/python.worker.ts)."""
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORKER = os.path.join(ROOT, "src", "engine", "python.worker.ts")
TIMEOUT_S = 6


def harness_source():
    with open(WORKER, encoding="utf-8") as f:
        return re.search(r"const HARNESS = `(.*?)`", f.read(), re.S).group(1)


def run_isolated(code, test, stdin=""):
    """Ejecuta en un proceso aparte para aislar estado y cortar bucles infinitos."""
    payload = json.dumps({"code": code, "test": test, "stdin": stdin})
    try:
        p = subprocess.run(
            [sys.executable, "-I", __file__, "--run"],
            input=payload, capture_output=True, text=True, encoding="utf-8", timeout=TIMEOUT_S,
        )
    except subprocess.TimeoutExpired:
        return {"stdout": "", "error": {"type": "Timeout"}, "test_error": None}
    if p.returncode != 0:
        return {"stdout": "", "error": {"type": "Crash", "message": p.stderr[-500:]}, "test_error": None}
    return json.loads(p.stdout.strip().splitlines()[-1])


def norm(s):
    return "\n".join(line.rstrip() for line in s.replace("\r", "").split("\n")).strip()


def passes(ex, r):
    if r["error"] or r["test_error"]:
        return False
    return "expectedOutput" not in ex or norm(r["stdout"]) == norm(ex["expectedOutput"])


def main(path):
    with open(path, encoding="utf-8") as f:
        exercises = json.load(f)
    problems = []
    ids = [e["id"] for e in exercises]
    for dup in {i for i in ids if ids.count(i) > 1}:
        problems.append(f"id repetido: {dup}")

    for ex in exercises:
        if ex["kind"] == "code":
            sol = run_isolated(ex["solution"], ex.get("test", ""), ex.get("stdin", ""))
            if not passes(ex, sol):
                problems.append(f"{ex['id']}: la solución NO pasa -> {sol['error'] or sol['test_error'] or repr(sol['stdout'])}")
            start = run_isolated(ex["starter"], ex.get("test", ""), ex.get("stdin", ""))
            if passes(ex, start):
                problems.append(f"{ex['id']}: el código inicial ya pasa (el reto no exige nada)")
        else:
            r = run_isolated(ex["code"], "")
            got = "Error" if r["error"] else norm(r["stdout"])
            if got != ex["options"][ex["answer"]]:
                problems.append(f"{ex['id']}: la respuesta marcada no coincide; el código imprime {got!r}")
            if len(set(ex["options"])) != len(ex["options"]):
                problems.append(f"{ex['id']}: opciones repetidas")

    code = sum(e["kind"] == "code" for e in exercises)
    print(f"{len(exercises)} retos ({code} de código, {len(exercises) - code} de predecir), XP total {sum(e['xp'] for e in exercises)}")
    for p in problems:
        print("  ✗", p)
    print("Todo en orden ✓" if not problems else f"{len(problems)} problema(s)")
    return 1 if problems else 0


if __name__ == "__main__":
    if sys.argv[1:] == ["--run"]:
        sys.stdout.reconfigure(encoding="utf-8")
        job = json.loads(sys.stdin.read())
        ns = {}
        exec(harness_source(), ns)
        print(ns["__loppy_run"](job["code"], job["test"], job["stdin"]))
    else:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.exit(main(sys.argv[1]))
