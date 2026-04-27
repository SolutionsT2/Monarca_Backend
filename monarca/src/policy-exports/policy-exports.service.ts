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

  async generateAdvancePolicies(): Promise<any[]> {
    const requests = await this.requestRepo.find({
      where: {}, 
      relations: [
        'user',
        'user.department',
        'user.department.cost_center',
        'user.department.cost_center.company',
      ],
    });

    const filteredRequests = requests.filter(req => req.advance_money > 0);

    if (filteredRequests.length === 0) {
      throw new NotFoundException('No data available to generate policies');
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
}
