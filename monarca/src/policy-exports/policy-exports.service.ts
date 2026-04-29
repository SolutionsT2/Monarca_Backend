import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'src/requests/entities/request.entity';
import { Company } from 'src/companies/entity/company.entity';

@Injectable()
export class PolicyExportsService {
  constructor(
    @InjectRepository(Request)
    private readonly requestRepo: Repository<Request>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
  ) {}

  private getTripStartDate(req: Request): Date | null {
    if (!req.requests_destinations || req.requests_destinations.length === 0) {
      return null;
    }
    const dates = req.requests_destinations.map(d => new Date(d.departure_date).getTime());
    return new Date(Math.min(...dates));
  }

  async generateAdvancePolicies(startDate: string, endDate: string): Promise<any[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const requests = await this.requestRepo.find({
      where: {}, 
      relations: [
        'user',
        'user.department',
        'user.department.cost_center',
        'user.department.cost_center.company',
        'requests_destinations',
      ],
    });

    const filteredRequests = requests.filter(req => {
      if (req.advance_money <= 0) return false;
      
      const tripStartDate = this.getTripStartDate(req);
      if (!tripStartDate) return false;

      return tripStartDate >= start && tripStartDate <= end;
    });

    if (filteredRequests.length === 0) {
      throw new NotFoundException('No hay datos disponibles para generar pólizas en el rango de fechas seleccionado');
    }

    const policies = filteredRequests.map(req => {
      const user = req.user;
      const idViaje = req.id;
      
      const idEmployee = user?.employeeNumber || '000';
      const vendorNo = user?.supplierNumber || '0000000000';
      
      const company = user?.department?.cost_center?.company;
      const compCode = company?.key || '1000';
      
      const now = new Date();
      const pstngDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getFullYear()).slice(-2)}`;
      
      const currency = company?.localCurrency || 'MXN';
      
      const exchRate = currency === 'MXN' ? 1.0000 : 18.0000;

      const itemText = `Anticipo Viaje # ${idViaje} #Emp${idEmployee}`;
      const amount = Number(req.advance_money || 0);

      return {
        cabecera: {
          ID_VIAJE: idViaje,
          DOC_TYPE: 'AV',
          HEADER_TXT: `Anticipo Viaje # ${idViaje}`,
          COMP_CODE: compCode,
          PSTNG_DATE: pstngDate,
          CURRENCY: currency,
          EXCH_RATE: exchRate,
        },
        detalle: [
          {
            ITEMNO_ACC: 1,
            SHKZG: 'S',
            GL_ACCOUNT: '1000',
            VENDOR_NO: vendorNo,
            ITEM_TEXT: itemText,
            AMT_DOCCUR: amount,
          },
          {
            ITEMNO_ACC: 2,
            SHKZG: 'H',
            GL_ACCOUNT: '1001',
            VENDOR_NO: vendorNo,
            ITEM_TEXT: itemText,
            AMT_DOCCUR: amount,
          },
        ],
      };
    });

    return policies;
  }

  async generateReconciliationPolicies(startDate: string, endDate: string): Promise<any[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const requests = await this.requestRepo.find({
      where: {}, 
      relations: [
        'user',
        'user.department',
        'user.department.cost_center',
        'user.department.cost_center.company',
        'vouchers',
        'requests_destinations',
      ],
    });

    const filteredRequests = requests.filter(req => {
      if (req.advance_money <= 0) return false;
      
      const tripStartDate = this.getTripStartDate(req);
      if (!tripStartDate) return false;

      return tripStartDate >= start && tripStartDate <= end;
    });

    const policies: any[] = [];

    for (const req of filteredRequests) {
      const user = req.user;
      const idViaje = req.id;
      
      const vendorNo = user?.supplierNumber || '0000000000';
      const costCenterCode = user?.department?.cost_center?.key || '000';
      
      const company = user?.department?.cost_center?.company;
      const compCode = company?.key || '1000';
      
      const now = new Date();
      const pstngDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
      
      const currency = company?.localCurrency || 'MXN';
      const exchRate = currency === 'MXN' ? 1.0000 : 18.0000;

      for (const voucher of req.vouchers || []) {
        // Ensures that only vouchers that have been officially verified and approved by an administrator are included in the policy export, don't want to send "Pending" or "Rejected".
        if (voucher.status !== 'voucher approved' && voucher.status !== 'Voucher Approved') continue;

        const totalAmount = Number(voucher.amount || 0);
        // Simulates a breakdown of Subtotal and Tax (IVA)
        const line1Amt = Number((totalAmount * 0.85).toFixed(4));
        const line2Amt = Number((totalAmount - line1Amt).toFixed(4));

        const itemText = voucher.class || 'Comprobación';

        policies.push({
          cabecera: {
            ID_VIAJE: idViaje,
            DOC_TYPE: 'GV',
            HEADER_TXT: `Comprobación Viaje # ${idViaje}`,
            COMP_CODE: compCode,
            PSTNG_DATE: pstngDate,
            CURRENCY: currency,
            EXCH_RATE: exchRate,
          },
          detalle: [
            {
              ITEMNO_ACC: 1,
              SHKZG: 'S',
              GL_ACCOUNT: '1002',
              COSTCENTER: costCenterCode,
              ITEM_TEXT: itemText,
              AMT_DOCCUR: line1Amt,
            },
            {
              ITEMNO_ACC: 2,
              SHKZG: 'S',
              GL_ACCOUNT: '1003',
              ITEM_TEXT: itemText,
              AMT_DOCCUR: line2Amt,
            },
            {
              ITEMNO_ACC: 3,
              SHKZG: 'H',
              GL_ACCOUNT: '1000',
              VENDOR_NO: vendorNo,
              ITEM_TEXT: itemText,
              AMT_DOCCUR: totalAmount,
            },
          ],
        });
      }
    }

    if (policies.length === 0) {
      throw new NotFoundException('No hay datos disponibles para generar pólizas en el rango de fechas seleccionado');
    }

    return policies;
  }

  async generateNoAdvanceReconciliationPolicies(startDate: string, endDate: string): Promise<any[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const requests = await this.requestRepo.find({
      where: {}, 
      relations: [
        'user',
        'user.department',
        'user.department.cost_center',
        'user.department.cost_center.company',
        'vouchers',
        'requests_destinations',
      ],
    });

    const filteredRequests = requests.filter(req => {
      if (req.advance_money > 0) return false;
      
      const tripStartDate = this.getTripStartDate(req);
      if (!tripStartDate) return false;

      return tripStartDate >= start && tripStartDate <= end;
    });

    const policies: any[] = [];

    for (const req of filteredRequests) {
      const user = req.user;
      const idViaje = req.id;
      
      const vendorNo = user?.supplierNumber || '0000000000';
      const costCenterCode = user?.department?.cost_center?.key || '000';
      
      const company = user?.department?.cost_center?.company;
      const compCode = company?.key || '1000';
      
      const now = new Date();
      const pstngDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getFullYear()).slice(-2)}`;
      
      const currency = company?.localCurrency || 'MXN';
      const exchRate = currency === 'MXN' ? 1.0000 : 18.0000;

      for (const voucher of req.vouchers || []) {
        if (voucher.status !== 'voucher approved' && voucher.status !== 'Voucher Approved') continue;

        const totalAmount = Number(voucher.amount || 0);
        const line1Amt = Number((totalAmount * 0.85).toFixed(4));
        const line2Amt = Number((totalAmount - line1Amt).toFixed(4));

        const itemText = voucher.class || 'Comprobación';

        policies.push({
          cabecera: {
            ID_VIAJE: idViaje,
            DOC_TYPE: 'GV',
            HEADER_TXT: `Gasto sin Anticipo Viaje # ${idViaje}`,
            COMP_CODE: compCode,
            PSTNG_DATE: pstngDate,
            CURRENCY: currency,
            EXCH_RATE: exchRate,
          },
          detalle: [
            {
              ITEMNO_ACC: 1,
              SHKZG: 'S',
              GL_ACCOUNT: '1002',
              COSTCENTER: costCenterCode,
              ITEM_TEXT: itemText,
              AMT_DOCCUR: line1Amt,
            },
            {
              ITEMNO_ACC: 2,
              SHKZG: 'S',
              GL_ACCOUNT: '1003',
              ITEM_TEXT: itemText,
              AMT_DOCCUR: line2Amt,
            },
            {
              ITEMNO_ACC: 3,
              SHKZG: 'H',
              GL_ACCOUNT: '1001',
              VENDOR_NO: vendorNo,
              ITEM_TEXT: itemText,
              AMT_DOCCUR: totalAmount,
            },
          ],
        });
      }
    }

    if (policies.length === 0) {
      throw new NotFoundException('No hay datos disponibles para generar pólizas en el rango de fechas seleccionado');
    }

    return policies;
  }
}
