# Google Sheet setup — updated for the new form

The lead form now sends more fields than before. Replace your Apps Script code
with the version below so the extra columns are captured.

## If you already deployed the old script

1. Open your Google Sheet
2. **Extensions → Apps Script**
3. Delete everything in the editor and paste the code below
4. Save
5. **Deploy → Manage deployments → pencil icon → Version: New version → Deploy**

That last step matters. Saving alone does not update the live script.

> Existing rows stay as they are. New submissions use the new columns. If your
> sheet already has the old headers, either delete the header row (the script
> rewrites it on the next submission) or start a fresh sheet.

## The code

```javascript
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    var data  = e.parameter;

    var headers = [
      'Received',
      'Project(s)',
      'Name',
      'Phone',
      'Phone as typed',
      'Country',
      'Email',
      'Budget',
      'Enquiry type',
      'Property type(s)',
      'Bedrooms / area',
      'Company',
      'Message'
    ];

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
      sheet.setColumnWidth(1, 150);
      sheet.setColumnWidth(4, 140);
    }

    sheet.appendRow([
      new Date(),
      data.project        || data.projects     || '',
      data.name           || '',
      data.phone_e164     || '',
      data.phone_local    || '',
      data.phone_country  || '',
      data.email          || '',
      data.budget         || '',
      data.enquiry_type   || 'Residential',
      data.property_types || data.office_format || '',
      data.unit_size      || '',
      data.company_name   || '',
      data.message        || ''
    ]);

    // Keep the phone column as text so the leading + is not stripped
    var row = sheet.getLastRow();
    sheet.getRange(row, 4).setNumberFormat('@');
    sheet.getRange(row, 5).setNumberFormat('@');

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
```

## What each column holds

| Column | Example | Notes |
|---|---|---|
| Received | 24/07/2026 14:32 | Automatic |
| Project(s) | `Ramla` | On project pages this is fixed. On the homepage the person can pick several. |
| Name | `Ahmed Hassan` | Required |
| Phone | `+201221011789` | Required. Normalised — ready to paste into WhatsApp. |
| Phone as typed | `01221011789` | What they actually entered, kept in case anything needs checking |
| Country | `EG` | Two-letter code from the picker |
| Email | | Optional |
| Budget | `EGP 20M – 35M` | Optional |
| Property type(s) | `Villa, Chalet` | Optional, comma separated |
| Message | | Optional |

## Why two phone columns

The **Phone** column is the number in international format with the national
zero removed, so `01221011789` becomes `+201221011789`. That is the form
WhatsApp and most CRMs expect.

**Phone as typed** keeps exactly what the person entered. If a number ever looks
wrong, you can see what they actually typed rather than guessing.

Both columns are formatted as text so Google Sheets does not strip the leading
plus or convert long numbers into scientific notation.

## Getting an email on each new lead

In the Sheet: **Tools → Notification settings → Notify me when… any changes are
made → Email – right away**.
