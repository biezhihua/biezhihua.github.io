# SystemFirmwareTable

### **什么是 `SystemFirmwareTable`？**

`SystemFirmwareTable` 是一个与系统固件（BIOS 或 UEFI）相关的 Windows API 函数，用于访问系统固件提供的数据。它位于 Windows 的 **Kernel32.dll** 中，通常用于检索存储在固件中的特定信息，例如 ACPI 表、SMBIOS 数据、FIRMWARE TABLE 信息等。

在编程时，通过 `SystemFirmwareTable` 函数可以读取系统固件提供的特定表数据，开发者可以用它来获取硬件相关的信息。

---

### **函数原型**

```c
UINT GetSystemFirmwareTable(
  DWORD FirmwareTableProviderSignature,
  DWORD FirmwareTableID,
  PVOID pFirmwareTableBuffer,
  DWORD BufferSize
);
```

#### 参数说明：
1. **`FirmwareTableProviderSignature`**:
   - 表示固件表提供者的签名，例如：
     - **'ACPI'**：高级配置和电源接口（ACPI）表。
     - **'RSMB'**：系统管理 BIOS（SMBIOS）表。
   - 这些签名是 4 字节的字符串，通常写为字符常量（如 `'ACPI'`）。

2. **`FirmwareTableID`**:
   - 表示要检索的特定固件表的 ID。例如，ACPI 表中的 "DSDT" 或 "FACP"。

3. **`pFirmwareTableBuffer`**:
   - 指向接收表数据的缓冲区。如果设置为 `NULL`，则函数会返回所需缓冲区的大小。

4. **`BufferSize`**:
   - 表示 `pFirmwareTableBuffer` 缓冲区的大小。如果缓冲区太小，函数会返回所需的大小。

#### 返回值：
- 如果 `pFirmwareTableBuffer` 为 `NULL`，返回表数据所需的缓冲区大小。
- 如果调用成功，返回的是实际写入缓冲区的字节数。
- 如果调用失败，返回值为 0。

---

### **作用和用途**

1. **获取硬件信息**：
   - 可以获取固件中存储的详细硬件信息，例如 CPU 支持的功能、内存布局等。

2. **系统管理**：
   - 系统管理员可以使用该 API 检查 BIOS/UEFI 中是否包含特定的表，从而获取硬件配置或调试信息。

3. **ACPI 表访问**：
   - ACPI 表中包含许多关于电源管理和硬件接口的信息，例如：
     - `DSDT`：差异化系统描述表。
     - `FACP`：固定 ACPI 描述表。
   - 通过访问 ACPI 表，可以实现更深层次的硬件控制。

4. **BIOS/UEFI 调试**：
   - 调试工具可以通过该函数检查固件数据是否符合预期，例如验证 SMBIOS 是否正确存储了系统序列号。

5. **固件更新支持**：
   - 固件提供的数据可以用来辅助设计安全的固件更新流程。

---

### **常见使用场景**

#### **获取所有可用的固件表签名**
可以使用 `EnumSystemFirmwareTables` 函数列出所有支持的固件表签名，然后通过 `SystemFirmwareTable` 获取具体内容。

```c
#include <windows.h>
#include <stdio.h>

void ListFirmwareTables() {
    DWORD bufferSize = EnumSystemFirmwareTables('ACPI', NULL, 0);
    if (bufferSize == 0) {
        printf("Failed to enumerate firmware tables.\n");
        return;
    }

    char* tableSignatures = (char*)malloc(bufferSize);
    if (EnumSystemFirmwareTables('ACPI', tableSignatures, bufferSize)) {
        for (DWORD i = 0; i < bufferSize; i += 4) {
            printf("ACPI Table: %.4s\n", &tableSignatures[i]);
        }
    }
    free(tableSignatures);
}

int main() {
    ListFirmwareTables();
    return 0;
}
```

#### **读取特定的 ACPI 表**
以下代码示例读取指定的 ACPI 表：

```c
#include <windows.h>
#include <stdio.h>

void GetAcpiTable() {
    DWORD tableID = 'DSDT';  // 读取 DSDT 表
    DWORD bufferSize = GetSystemFirmwareTable('ACPI', tableID, NULL, 0);
    if (bufferSize == 0) {
        printf("Failed to get ACPI table size.\n");
        return;
    }

    void* buffer = malloc(bufferSize);
    if (GetSystemFirmwareTable('ACPI', tableID, buffer, bufferSize)) {
        printf("ACPI Table Data Retrieved Successfully.\n");
        // 这里可以解析表数据
    } else {
        printf("Failed to retrieve ACPI table data.\n");
    }
    free(buffer);
}

int main() {
    GetAcpiTable();
    return 0;
}
```

---

### **注意事项**

1. **权限**：
   - 读取固件数据可能需要管理员权限。

2. **兼容性**：
   - `SystemFirmwareTable` 和 `EnumSystemFirmwareTables` 从 Windows Vista 开始支持。

3. **缓冲区大小**：
   - 如果提供的缓冲区大小不足，函数会返回所需的大小，调用者需要动态分配。

4. **数据解析**：
   - 返回的数据通常是二进制格式，开发者需要根据表的格式（如 ACPI 表）自行解析。

---

### **相关 API**

1. **`EnumSystemFirmwareTables`**：
   - 用于列出系统中所有的固件表签名。

2. **`GetFirmwareEnvironmentVariable`**：
   - 获取固件环境变量（常用于 UEFI 系统）。

3. **`SetFirmwareEnvironmentVariable`**：
   - 设置固件环境变量。

---

### **总结**
`SystemFirmwareTable` 是一个强大的工具，用于在 Windows 中访问系统固件（BIOS/UEFI）中存储的重要数据。它在硬件调试、驱动程序开发和系统管理中都有广泛的应用。通过结合 `EnumSystemFirmwareTables`，开发者可以灵活地列出和读取特定的固件表数据。