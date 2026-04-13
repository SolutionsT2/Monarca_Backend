import { XMLParser } from 'fast-xml-parser';

export type XmlRequiredFieldValidation = {
  isValid: boolean;
  missingFields: string[];
};

function toArray<T>(value: T | T[] | undefined): T[] {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function findFirstNodeByKey(node: unknown, key: string): Record<string, unknown> | null {
  if (!node || typeof node !== 'object') {
    return null;
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findFirstNodeByKey(item, key);
      if (found) {
        return found;
      }
    }
    return null;
  }

  const record = node as Record<string, unknown>;
  if (record[key] && typeof record[key] === 'object') {
    return record[key] as Record<string, unknown>;
  }

  for (const value of Object.values(record)) {
    const found = findFirstNodeByKey(value, key);
    if (found) {
      return found;
    }
  }

  return null;
}

function getAttributeValue(
  node: Record<string, unknown> | null,
  attributeName: string,
): string | null {
  if (!node) {
    return null;
  }

  const candidates = [
    attributeName,
    attributeName.toLowerCase(),
    attributeName.toUpperCase(),
    `@_${attributeName}`,
    `@_${attributeName.toLowerCase()}`,
    `@_${attributeName.toUpperCase()}`,
  ];

  for (const candidate of candidates) {
    const value = node[candidate];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    if (typeof value === 'number') {
      return String(value);
    }
  }

  return null;
}

function getFiscalIdentifier(
  parsedXml: Record<string, unknown>,
  comprobanteNode: Record<string, unknown> | null,
): string | null {
  const timbreNode = findFirstNodeByKey(parsedXml, 'TimbreFiscalDigital');
  let uuid = getAttributeValue(timbreNode, 'UUID');

  if (!uuid) {
    const complementoNode = findFirstNodeByKey(parsedXml, 'Complemento');
    const timbreFromComplemento = toArray(
      complementoNode?.['TimbreFiscalDigital'] as
        | Record<string, unknown>
        | Record<string, unknown>[]
        | undefined,
    )[0];
    uuid = getAttributeValue(timbreFromComplemento ?? null, 'UUID');
  }

  if (uuid) {
    return uuid;
  }

  return getAttributeValue(comprobanteNode, 'Folio');
}

export function validateVoucherXmlRequiredFields(
  xml: string,
): XmlRequiredFieldValidation {
  let parsedXml: Record<string, unknown> = {};

  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      removeNSPrefix: true,
      parseAttributeValue: false,
      parseTagValue: false,
      trimValues: true,
      attributeNamePrefix: '',
    });
    parsedXml = parser.parse(xml);
  } catch {
    return {
      isValid: false,
      missingFields: [
        'RFC emisor',
        'RFC receptor',
        'total de la factura',
        'UUID (Folio Fiscal) o Folio',
      ],
    };
  }

  const comprobanteNode = findFirstNodeByKey(parsedXml, 'Comprobante');
  const emisorNode = findFirstNodeByKey(parsedXml, 'Emisor');
  const receptorNode = findFirstNodeByKey(parsedXml, 'Receptor');

  const issuerRfc = getAttributeValue(emisorNode, 'Rfc');
  const receiverRfc = getAttributeValue(receptorNode, 'Rfc');
  const invoiceTotal = getAttributeValue(comprobanteNode, 'Total');
  const fiscalIdentifier = getFiscalIdentifier(parsedXml, comprobanteNode);

  const missingFields: string[] = [];

  if (!issuerRfc) {
    missingFields.push('RFC emisor');
  }
  if (!receiverRfc) {
    missingFields.push('RFC receptor');
  }
  if (!invoiceTotal) {
    missingFields.push('total de la factura');
  }
  if (!fiscalIdentifier) {
    missingFields.push('UUID (Folio Fiscal) o Folio');
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}