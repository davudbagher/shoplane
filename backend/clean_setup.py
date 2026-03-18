with open("setup_coupons_api.py", "r") as f:
    lines = f.readlines()

clean = []
for l in lines:
    if "创新" in l:
        break
    clean.append(l)

with open("setup_coupons_api.py", "w") as f:
    f.writelines(clean)

print("Cleaned setup_coupons_api.py")
创新 ve
创
