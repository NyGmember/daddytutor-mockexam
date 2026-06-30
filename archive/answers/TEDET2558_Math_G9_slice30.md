---
exam_name: "TEDET"
subject: "คณิตศาสตร์"
level: "มัธยมต้น (G7-G9)"
grade: "G9"
year: 2558
difficulty: 4
topic_id: "measurement_and_geometry"
topic_name: "การวัดและเรขาคณิต"
answer: "12"
---

# คำถาม

30. กำหนดจุด E เป็นจุดใด ๆ บนด้าน BC ของรูปสี่เหลี่ยมผืนผ้า ABCD และจุดเซนทรอยด์ของ $\Delta ABE, \Delta AED, \Delta DEC$ คือจุด P, Q, R ตามลำดับ
![illustration](../images/TEDET2558_Math_G9_slice30_crop_0.png)
ถ้า $\square ABCD$ มีพื้นที่ 108 ตารางหน่วย จงหาว่า $\Delta PRQ$ มีพื้นที่กี่ตารางหน่วย

# คำอธิบายและวิธีทำ

ให้รูปสี่เหลี่ยมผืนผ้า $ABCD$ มีความกว้างเป็น $w$ และความยาวเป็น $l$ ดังนั้น พื้นที่ $[ABCD] = w \times l = 108$ ตารางหน่วย กำหนดให้พิกัดของจุดต่างๆ ดังนี้: $B(0, 0)$, $C(l, 0)$, $D(l, w)$, และ $A(0, w)$ ให้จุด $E$ อยู่บนด้าน $BC$ มีพิกัดเป็น $(x, 0)$ โดยที่ $0 \leq x \leq l$ 

จุดเซนทรอยด์ (Centroid) ของสามเหลี่ยมที่มีจุดยอด $(x_1, y_1), (x_2, y_2), (x_3, y_3)$ คือ $(\frac{x_1+x_2+x_3}{3}, \frac{y_1+y_2+y_3}{3})$:
1. จุด $P$ เป็นเซนทรอยด์ของ $\Delta ABE$: $P = (\frac{0+0+x}{3}, \frac{w+0+0}{3}) = (\frac{x}{3}, \frac{w}{3})$
2. จุด $Q$ เป็นเซนทรอยด์ของ $\Delta AED$: $Q = (\frac{0+l+x}{3}, \frac{w+w+0}{3}) = (\frac{l+x}{3}, \frac{2w}{3})$
3. จุด $R$ เป็นเซนทรอยด์ของ $\Delta DEC$: $R = (\frac{l+l+x}{3}, \frac{w+0+0}{3}) = (\frac{2l+x}{3}, \frac{w}{3})$

พื้นที่ของ $\Delta PRQ$ หาได้จากสูตรพื้นที่สามเหลี่ยมที่มีพิกัด $(x_1, y_1), (x_2, y_2), (x_3, y_3)$ คือ $\frac{1}{2} |x_1(y_2 - y_3) + x_2(y_3 - y_1) + x_3(y_1 - y_2)|$:
พื้นที่ $= \frac{1}{2} |\frac{x}{3}(\frac{2w}{3} - \frac{w}{3}) + \frac{l+x}{3}(\frac{w}{3} - \frac{w}{3}) + \frac{2l+x}{3}(\frac{w}{3} - \frac{2w}{3})|$
$= \frac{1}{2} |\frac{x}{3}(\frac{w}{3}) + 0 + \frac{2l+x}{3}(-\frac{w}{3})|$
$= \frac{1}{2} |\frac{xw}{9} - \frac{2lw + xw}{9}|$
$= \frac{1}{2} |-\frac{2lw}{9}| = \frac{lw}{9}$

เนื่องจาก $lw = 108$ จะได้พื้นที่ $\Delta PRQ = \frac{108}{9} = 12$ ตารางหน่วย
