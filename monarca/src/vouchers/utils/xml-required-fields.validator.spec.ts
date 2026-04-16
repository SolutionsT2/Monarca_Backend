import { validateVoucherXmlRequiredFields } from './xml-required-fields.validator';

describe('validateVoucherXmlRequiredFields', () => {
  it('returns valid when XML has all required fields', () => {
    const xml = `
      <cfdi:Comprobante Total="1200.50">
        <cfdi:Emisor Rfc="AAA010101AAA" />
        <cfdi:Receptor Rfc="BBB010101BBB" />
        <cfdi:Complemento>
          <tfd:TimbreFiscalDigital UUID="a7e7f3f9-1234-5678-9123-aabbccddeeff" />
        </cfdi:Complemento>
      </cfdi:Comprobante>
    `;

    const result = validateVoucherXmlRequiredFields(xml);

    expect(result.isValid).toBe(true);
    expect(result.missingFields).toEqual([]);
  });

  it('returns missing fields when required values are absent', () => {
    const xml = `
      <cfdi:Comprobante>
        <cfdi:Emisor />
      </cfdi:Comprobante>
    `;

    const result = validateVoucherXmlRequiredFields(xml);

    expect(result.isValid).toBe(false);
    expect(result.missingFields).toEqual([
      'RFC emisor',
      'RFC receptor',
      'total de la factura',
      'UUID (Folio Fiscal) o Folio',
    ]);
  });

  it('returns valid when UUID is missing but Folio exists', () => {
    const xml = `
      <cfdi:Comprobante Total="1160.00" Folio="100">
        <cfdi:Emisor Rfc="EKU9003173C9" />
        <cfdi:Receptor Rfc="URE1804291H5" />
      </cfdi:Comprobante>
    `;

    const result = validateVoucherXmlRequiredFields(xml);

    expect(result.isValid).toBe(true);
    expect(result.missingFields).toEqual([]);
  });
});