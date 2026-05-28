declare module 'html2pdf.js' {
  interface Html2PdfWorker {
    set(options: Record<string, unknown>): Html2PdfWorker;
    from(element: HTMLElement): Html2PdfWorker;
    outputPdf(type: 'blob'): Promise<Blob>;
    save(): Promise<void>;
  }
  function html2pdf(): Html2PdfWorker;
  export default html2pdf;
}

declare module 'react-datepicker' {
  import { ComponentType, InputHTMLAttributes } from 'react';
  interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
    selected?: Date | null;
    onChange?: (date: Date | null) => void;
    minDate?: Date;
    dateFormat?: string;
    placeholderText?: string;
  }
  const DatePicker: ComponentType<DatePickerProps>;
  export default DatePicker;
}
