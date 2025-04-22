# Excel Data Mapping Documentation

## Overview

This document describes the structure and data mapping of an investment portfolio Excel workbook with 5 investment models, providing the necessary context for working with this data programmatically.

## Investment Models

The workbook contains these 5 investment models:

1. **Growth** - Growth-oriented investments
2. **Core** - Core investment strategy
3. **Small/Mid (SMID)** - Small and mid-cap investments
4. **Alternative** - Alternative investments
5. **Structured Notes** - Structured investment products

Growth, Core, and SMID share similar layouts but have model-specific metrics. Alternative and Structured Notes each have unique layouts.

## Common Worksheet Structure

### Growth, Core, and SMID Pattern

Each model uses three worksheets with consistent naming:

* `{model}_overview` - Contains metadata and commentary
* `{model}_positions` - Contains sector allocation data and securities information
* `{model}_stats` - Contains holdings, regional allocation, and financial metrics

### Key Data Ranges

#### Overview Worksheets

**Metadata Section:**

* **Range:** `B6:C11`
* **Headers:**
  ```
  Metadata        Value
  ```
* **Example Data:**
  ```
  As Of Date      3/31/2025      (Date type)Portfolio       GROWTH         (General type)Classification  GICS Sectors   (General type)Currency        USD            (General type)Benchmark       DM INDEX       (General type)
  ```

**Commentary Section:**

* **Range:** `D15` (single cell containing multiple paragraphs)
* **No Headers** (single cell content)

#### Positions Worksheets

**Sectors Information:**

* **Sector Names:**
  * **Range:** `B4:B15`
  * **Header:** `Sector Name`
  * **Data Example:** Financials, Healthcare, Consumer Discretionary, etc.
* **Sector Allocations:**
  * **Range:** `F4:F15`
  * **Header:** `New Total (%)`
  * **Data Example:** 17.0, 11.5, 11.0, 2.0, 24.0, etc.
* **Sector Changes:**
  * **Range:** `G4:G15`
  * **Header:** `Diff (%)`
  * **Data Example:** 1.0, -0.5, 0.0, 0.0, 1.0, etc.

**Securities Changes:**

* **Securities Added:** `C18` (comma-delimited text in a single cell)
* **Securities Removed:** `C20` (comma-delimited text in a single cell)
* **No column headers** for these specific cells

#### Stats Worksheets

**Top Ten Holdings:**

* **Range:** `B6:D16` (includes headers)
* **Headers:**
  ```
  Rank    Name                     Weight (%)
  ```
* **Data Example:**
  ```
  1.0     MICROSOFT CORP          3.02.0     NVIDIA CORP             2.8
  ```

**Regional Allocation:**

* **Range:** `B19:D24` (includes headers)
* **Headers:**
  ```
  Region               Holdings    Weight (%)
  ```
* **Data Example:**
  ```
  North America        61.0        90.0Western Europe       5.0         6.1
  ```

**Financial Metrics (Model-Specific):**

* **Growth Metrics:**
  * **Range:** `B28:E36`
  * **Headers:**
    ```
    Metric           Portfolio    Benchmark    Difference
    ```
  * **Metrics Data:**
    ```
    Market Value(%)     100.0        100.0        0.0Div Yld              1.8          2.3        -0.5P/E                 22.5         20.1         2.5P/CF                15.6         14.8         0.8P/B                  4.3          3.1         1.2Debt/Equity        117.4        140.2       -22.8Current Ratio        1.4          1.2         0.2ROE                 20.7         14.9         5.8
    ```
* **Core Metrics:**
  * **Range:** `B28:E34`
  * **Headers:**
    ```
    Metric           Portfolio    Benchmark    Difference
    ```
  * **Metrics Data:**
    ```
    Market Value (%)     100.0        100.0        0.0Div Yld                2.5          2.3        0.2P/E                   15.3         20.1       -4.8P/CF                  11.2         14.8       -3.6ROE                   17.8         14.9        2.9Sales Gr               5.9          3.8        2.1
    ```
* **SMID Metrics:**
  * **Range:** `B28:E34`
  * **Headers:**
    ```
    Metric           Portfolio    Benchmark    Difference
    ```
  * **Metrics Data:**
    ```
    Market Value (%)     100.0        100.0        0.0Div Yld                2.7         3.01       -0.31P/E                  12.54        45.97      -53.43P/CF                  8.84        12.47       -3.63ROE                  12.41         0.31       12.10Sales Gr              5.89         0.84        5.05
    ```

## Alternative Model

**Overview Worksheet (`alternatives_overview`):**

* **Metadata:**
  * **Range:** `B6:C11`
  * **Headers:**
    ```
    Metadata        Value
    ```
  * **Data Example:**
    ```
    As Of Date      3/31/2025Portfolio       ALTERNATIVESClassification  -Currency        USDBenchmark       -
    ```
* **Fund Commentary:**
  * **Range:** `C15:D(X)` where X is variable based on number of funds
  * **Headers:**
    ```
    Fund            Commentary
    ```
  * **Data Example:**
    ```
    Nuveen CLO Issuance Fund LP    Performance results for the first quarter have not been released...The US Affordable Housing Fund  We continue to work with our partner Skyline to lower the cost...Beacon 2 Fund                  The fund is completing the change of the general partner...
    ```

## Structured Notes Model

**Overview Worksheet (`structured_notes_overview`):**

* **Metadata:**
  * **Range:** `B6:C11`
  * **Headers:**
    ```
    Metadata        Value
    ```
  * **Data Example:** Similar to other models but with fewer fields
* **Commentary:**
  * **Range:** `D15` (single cell, similar to other models)
  * **No Headers** (single cell content)
* **Purchased Notes:**
  * **Range:** `B18:G28`
  * **Headers:**
    ```
    Pricing Date           Bank        Ticker      Short Name      GICS Sector           Coupon
    ```
  * **Data Example:**
    ```
    Friday April 18, 2025  UBS         EXPE US     EXPEDIA GROUP   Consumer Discretionary 10.7%Tuesday May 6, 2025    JPM         CVS US      CVS HEALTH CORP Health Care           9.5%Saturday Sept 6, 2025  UBS         DG US       DOLLAR GENERAL  Consumer Staples      11.1%
    ```

## Implementation Guidelines

1. **Worksheet Access Strategy:**
   * Use the model name as a prefix to generate worksheet references
   * Example: For Growth model, access `growth_overview`, `growth_positions`, and `growth_stats`
2. **Data Type Handling:**
   * **Dates:** "As Of Date" is in MM/DD/YYYY format
   * **Percentages:** Values displayed with % symbol may need conversion
   * **Lists:** Parse comma-delimited cells using string splitting functions
   * **Dynamic ranges:** Handle variable row counts in Alternative fund commentary
3. **Model-Specific Considerations:**
   * **Metrics sections:** Each model has unique metrics or different values
   * **Growth:** Has additional financial ratios not present in other models
   * **Alternative:** Requires handling of the dynamic range for fund commentaries
   * **Structured Notes:** Has unique purchased notes data structure
4. **Best Practices:**
   * Always skip header rows when extracting tabular data
   * Handle the different metrics sections based on the specific model
   * When working with similar ranges across models, parameterize the model name
   * Test extraction with each model separately to verify correct handling
