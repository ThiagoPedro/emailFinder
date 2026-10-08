import os
import zipfile
import shutil

base_dir = os.path.dirname(os.path.abspath(__file__))
dist_dir = os.path.join(base_dir, "dist")
os.makedirs(dist_dir, exist_ok=True)

# 1. Arquivo 1: Apenas os arquivos alterados
zip1_path = os.path.join(dist_dir, "emailFinder-v0.1.5-patch-only.zip")
files_modified = [
    os.path.join("emailFinder", "background.js"),
    os.path.join("emailFinder", "manifest.json"),
    os.path.join("emailFinder", "readme.md"),
    "README.md",
    "todo.md",
    "build-release.sh"
]
with zipfile.ZipFile(zip1_path, "w", zipfile.ZIP_DEFLATED) as z:
    for f in files_modified:
        full_p = os.path.join(base_dir, f)
        if os.path.exists(full_p):
            z.write(full_p, f)

# 2. Arquivo 2: Runtime com manifest.json na raiz (.xpi)
zip2_path = os.path.join(dist_dir, "emailFinder-v0.1.5-runtime.zip")
xpi_path = os.path.join(dist_dir, "emailFinder-v0.1.5.xpi")
src_dir = os.path.join(base_dir, "emailFinder")
with zipfile.ZipFile(zip2_path, "w", zipfile.ZIP_DEFLATED) as z:
    for root, _, files in os.walk(src_dir):
        for f in files:
            full_p = os.path.join(root, f)
            arcname = os.path.relpath(full_p, src_dir)
            z.write(full_p, arcname)
shutil.copy(zip2_path, xpi_path)

# 3. Arquivo 3: Projeto Completo
zip3_path = os.path.join(dist_dir, "emailFinder-v0.1.5-full-project.zip")
with zipfile.ZipFile(zip3_path, "w", zipfile.ZIP_DEFLATED) as z:
    for root, _, files in os.walk(base_dir):
        if "dist" in root or ".git" in root:
            continue
        for f in files:
            if f.endswith(".zip") or f.endswith(".xpi"):
                continue
            full_p = os.path.join(root, f)
            arcname = os.path.relpath(full_p, base_dir)
            z.write(full_p, arcname)

print("Os 3 pacotes foram criados com sucesso na pasta 'dist/':")
print(f"1. {zip1_path}")
print(f"2. {zip2_path} (e {xpi_path})")
print(f"3. {zip3_path}")