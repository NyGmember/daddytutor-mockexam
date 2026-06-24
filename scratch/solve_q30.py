import math

# Coordinates of the vertices of triangle ABC
# Let B be at (0, 0)
# Angle B = 80 degrees, Angle C = 80 degrees, Angle A = 20 degrees.
# Let BC be along the x-axis, so C is at (1, 0).
# AB is at 80 degrees, AC is at 100 degrees from C (which is 180 - 80).
# A_x = 0.5
# A_y = 0.5 * tan(80)

tan80 = math.tan(math.radians(80))
A = (0.5, 0.5 * tan80)
B = (0.0, 0.0)
C = (1.0, 0.0)

# D is on AC. We know AD = BD.
# D = A + t * (C - A) for t in [0, 1].
# A = (0.5, 0.5 * tan80)
# C = (1.0, 0.0)
# D_x = 0.5 + t * 0.5
# D_y = 0.5 * tan80 * (1 - t)

# We want dist(D, A) = dist(D, B)
# dist(D, A)^2 = (D_x - A_x)^2 + (D_y - A_y)^2 = (t * 0.5)^2 + (t * 0.5 * tan80)^2 = t^2 * 0.25 * (1 + tan80^2)
# dist(D, B)^2 = D_x^2 + D_y^2 = (0.5 + t * 0.5)^2 + (0.5 * tan80 * (1 - t))^2

# Let's solve dist(D, A)^2 = dist(D, B)^2:
# t^2 * 0.25 * (1 + tan80^2) = 0.25 * (1 + t)^2 + 0.25 * tan80^2 * (1 - t)^2
# t^2 * (1 + tan80^2) = 1 + 2t + t^2 + tan80^2 * (1 - 2t + t^2)
# t^2 + t^2 * tan80^2 = 1 + 2t + t^2 + tan80^2 - 2t * tan80^2 + t^2 * tan80^2
# 0 = 1 + 2t + tan80^2 - 2t * tan80^2
# 2t * (tan80^2 - 1) = tan80^2 + 1
# t = (tan80^2 + 1) / (2 * (tan80^2 - 1))

t = (tan80**2 + 1) / (2 * (tan80**2 - 1))
D = (0.5 + t * 0.5, 0.5 * tan80 * (1 - t))

# E is on AB. We know BE = BC.
# Since BC = 1, BE = 1.
# E is at (cos(80), sin(80))
E = (math.cos(math.radians(80)), math.sin(math.radians(80)))

# Let's define vector functions
def dot(v1, v2):
    return v1[0]*v2[0] + v1[1]*v2[1]

def norm(v):
    return math.sqrt(v[0]**2 + v[1]**2)

def angle_between(v1, v2):
    cos_theta = dot(v1, v2) / (norm(v1) * norm(v2))
    return math.degrees(math.acos(cos_theta))

# Vectors for BDE:
# DB = B - D
# DE = E - D
v_DB = (B[0] - D[0], B[1] - D[1])
v_DE = (E[0] - D[0], E[1] - D[1])
angle_BDE = angle_between(v_DB, v_DE)

# Vectors for CED:
# EC = C - E
# ED = D - E
v_EC = (C[0] - E[0], C[1] - E[1])
v_ED = (D[0] - E[0], D[1] - E[1])
angle_CED = angle_between(v_EC, v_ED)

print(f"t: {t}")
print(f"D: {D}")
print(f"E: {E}")
print(f"Angle BDE: {angle_BDE}")
print(f"Angle CED: {angle_CED}")
print(f"Difference (CED - BDE): {angle_CED - angle_BDE}")
