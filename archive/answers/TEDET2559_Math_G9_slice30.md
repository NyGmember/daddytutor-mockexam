---
exam_name: "TEDET"
subject: "คณิตศาสตร์"
level: "มัธยมต้น (G7-G9)"
grade: "G9"
year: 2559
difficulty: 4
topic_id: "measurement_and_geometry"
topic_name: "การวัดและเรขาคณิต"
answer: "12"
---

# คำถาม

30. ให้ $ABC$ เป็นรูปสามเหลี่ยมซึ่งมี $\angle B = 2\angle C$ จุด $N$ เป็นจุดกึ่งกลางด้าน $BC$ และ $\overline{AD} \perp \overline{BC}$ ![illustration](../images/TEDET2559_Math_G9_slice30_crop_0.png) ถ้า $AB = 24$ เซนติเมตร แล้ว $DN$ เท่ากับกี่เซนติเมตร

# คำอธิบายและวิธีทำ

ให้ $\angle C = \theta$ ดังนั้น $\angle B = 2\theta$ กำหนดให้ $AD$ เป็นส่วนสูงที่ลากจาก $A$ มายัง $BC$ ที่จุด $D$ ดังนั้น $\triangle ABD$ และ $\triangle ACD$ เป็นรูปสามเหลี่ยมมุมฉาก โดยที่ $\angle ADB = \angle ADC = 90^\circ$ \nใน $\triangle ABD$: $\sin B = \frac{AD}{AB} = \frac{AD}{24} \implies AD = 24 \sin 2\theta$ \nใน $\triangle ADC$: $\tan C = \frac{AD}{CD} \implies CD = \frac{AD}{\tan \theta} = \frac{24 \sin 2\theta}{\tan \theta} = \frac{24 (2 \sin \theta \cos \theta)}{\sin \theta / \cos \theta} = 48 \cos^2 \theta$ \nใน $\triangle ABD$: $BD = \sqrt{AB^2 - AD^2} = \sqrt{24^2 - (24 \sin 2\theta)^2} = 24 \cos 2\theta$ \nเนื่องจาก $N$ เป็นจุดกึ่งกลางของ $BC$ ดังนั้น $BN = NC = \frac{BD + DC}{2}$ \nเราต้องการหา $DN = |BN - BD| = |\frac{BD + DC}{2} - BD| = |\frac{DC - BD}{2}|$ \nแทนค่า $DC = 48 \cos^2 \theta$ และ $BD = 24(2 \cos^2 \theta - 1) = 48 \cos^2 \theta - 24$ \n$DN = \frac{(48 \cos^2 \theta) - (48 \cos^2 \theta - 24)}{2} = \frac{24}{2} = 12$
