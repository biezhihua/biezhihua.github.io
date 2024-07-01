# Color Difference Calculation

## 偏色计算

偏色计算通常涉及比较两种颜色，并确定它们之间的数值差异。这可以通过多种方法完成，其中最简单的一种是在RGB颜色空间中使用欧几里得距离。这种方法计算两种颜色作为RGB颜色立方体中的点的距离。

### 十六进制颜色表示
- 十六进制颜色格式为`#RRGGBB`，其中`RR`、`GG`和`BB`是从00到FF的两位十六进制数（十进制中是0到255）。这些表示红色、绿色和蓝色成分的强度。

### 从十六进制转换为RGB
- 首先，需要将十六进制值转换为RGB（红色、绿色、蓝色）格式。例如：
  - `#ADA5D4`转换为RGB(173, 165, 212)。
  - `#0C0C06`转换为RGB(12, 12, 6)。

### 计算颜色差异
- 这两种颜色在RGB空间的欧几里得距离可以使用以下公式计算：
  \[
  \text{距离} = \sqrt{(R_2 - R_1)^2 + (G_2 - G_1)^2 + (B_2 - B_1)^2}
  \]
  其中\( R_1, G_1, B_1 \)是第一种颜色的RGB值，\( R_2, G_2, B_2 \)是第二种颜色的RGB值。

### Python示例计算
这里是如何在Python中进行计算的示例：

```python
import math

def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')  # 移除'#'符号
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))  # 将十六进制转换为十进制

def calculate_color_difference(color1, color2):
    rgb1 = hex_to_rgb(color1)
    rgb2 = hex_to_rgb(color2)
    return math.sqrt(sum((c2 - c1) ** 2 for c1, c2 in zip(rgb1, rgb2)))

# 示例使用
color1 = "#ADA5D4"
color2 = "#0C0C06"
difference = calculate_color_difference(color1, color2)
print(f"颜色差异: {difference}")
```

此示例提供了一个简单的函数，用于将十六进制颜色转换为RGB，并使用另一个函数来计算它们之间的欧几里得距离，有效地测量一种颜色在视觉上与另一种颜色的差异。这是一种基本方法，在许多应用中都很有效，尽管在更多色彩关键的应用中可能会使用CIE76、CIE94、CIE2000等更复杂的颜色差异公式，以适应人类视觉的变异性。



## Demo

def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def color_difference(rgb1, rgb2):
    return tuple(abs(c1 - c2) for c1, c2 in zip(rgb1, rgb2))

def is_within_color_range(color_string, color_to_check):
    base_color, tolerance_color = color_string.split('-')
    
    rgb_check = hex_to_rgb(color_to_check)
    rgb_base = hex_to_rgb(base_color)
    rgb_tolerance = hex_to_rgb(tolerance_color)

    # Calculate the acceptable difference between the base color and the tolerance color
    tolerance_diff = color_difference(rgb_base, rgb_tolerance)

    # Calculate the actual difference between the color to check and the base color
    actual_diff = color_difference(rgb_check, rgb_base)

    # Check if the actual difference is within the tolerance range
    return all(a <= t for a, t in zip(actual_diff, tolerance_diff))

# Example
color_string = "#ADA5D4-#0C0C06"
color_to_check = "#ADA5D4"
result = is_within_color_range(color_string, color_to_check)
print("颜色是否在范围内:", result)
