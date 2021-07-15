export class CreateTicketDto {
  projectId: number;
  publicKey: string;
  signature: string;
  message: string;
}
