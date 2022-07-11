import { Earnings } from "./earnings.model";

export interface Consultant {
  name: string,
  emailJob: string,
  emailPrivate: string,
  phone: string,
  userName: string,
  selected: boolean,
  earnings: Earnings[]
}
