import React,{ useEffect,useRef } from 'react';

interface PostcodeInputProps {
  format: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  countryCode?: string;
  fixedValue?: string | null;
  source?: string | null;
  name?: string;
  autoComplete?: string;
  dataField?: string;
}

type PostcodeStructure =
  | { type: 'digit'; index: number }
  | { type: 'alpha'; index: number }
  | { type: 'any'; index: number }
  | { type: 'fixed'; char: string; index: number }
  | { type: 'static'; char: string; index: number };

export const PostcodeInput: React.FC<PostcodeInputProps> = ({
  format,
  value,
  onChange,
  className,
  countryCode,
  fixedValue,
  source,
  name,
  autoComplete,
  dataField,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const isFixed = Boolean(fixedValue);
  const displayFormat = fixedValue || format;

  // Parse format to determine input structure
  // N: Digit, A: Alphabet, ?: Any, others: static characters
  const structure: PostcodeStructure[] = displayFormat.split('').map((char, index) => {
    if (isFixed) {
      return /[\s-]/.test(char) ? { type: 'static', char, index } : { type: 'fixed', char, index };
    }
    if (char === 'N') return { type: 'digit', index };
    if (char === 'A') return { type: 'alpha', index };
    if (char === '?') return { type: 'any', index };
    return { type: 'static', char, index };
  });

  const editableFields = structure.filter(s => s.type !== 'static');
  const values = (fixedValue || value).split('');

  useEffect(() => {
    if (fixedValue && value !== fixedValue) {
      onChange(fixedValue);
    }
  }, [fixedValue, onChange, value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, fieldIndex: number) => {
    if (isFixed) return;
    const char = e.target.value.slice(-1).toUpperCase();
    if (!char) return;

    const field = editableFields[fieldIndex];
    if (!field || field.type === 'fixed') return;
    if (field.type === 'digit' && !/\d/.test(char)) return;
    if (field.type === 'alpha' && !/[A-Z]/.test(char)) return;

    const newValues = [...values];
    // Ensure array is long enough
    while (newValues.length <= field.index) newValues.push(' ');
    
    newValues[field.index] = char;
    
    // Fill in static characters if they are missing
    structure.forEach(s => {
      if (s.type === 'static') {
        newValues[s.index] = s.char;
      }
    });

    onChange(newValues.join('').trim());

    // Focus next field
    if (fieldIndex < editableFields.length - 1) {
      inputRefs.current[fieldIndex + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, fieldIndex: number) => {
    if (isFixed) return;
    if (e.key === 'Backspace') {
      const newValues = [...values];
      const field = editableFields[fieldIndex];
      if (!field || field.type === 'fixed') return;
      
      if (!newValues[field.index] || newValues[field.index] === ' ') {
        // Focus previous field
        if (fieldIndex > 0) {
          inputRefs.current[fieldIndex - 1]?.focus();
        }
      } else {
        newValues[field.index] = ' ';
        onChange(newValues.join('').trim());
      }
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`} title={source || undefined}>
      {countryCode && (
        <div className="mr-2 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-lg p-1 px-1.5 shadow-sm">
          <img 
            src={`https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`} 
            alt={countryCode}
            className="w-5 h-auto rounded-md shadow-sm"
            referrerPolicy="no-referrer"
          />
        </div>
      )}
      {structure.map((s, i) => {
        if (s.type === 'static') {
          return <span key={i} className="text-gray-500 font-mono">{s.char}</span>;
        }

        const fieldIndex = editableFields.indexOf(s);
        return (
          <input
            key={i}
            ref={el => { if (el) inputRefs.current[fieldIndex] = el; }}
            type="text"
            name={name ? name + '.' + fieldIndex : undefined}
            autoComplete={fieldIndex === 0 ? autoComplete : 'off'}
            data-veygrit-field={dataField}
            value={s.type === 'fixed' ? s.char : values[s.index] || ''}
            onChange={e => handleChange(e, fieldIndex)}
            onKeyDown={e => handleKeyDown(e, fieldIndex)}
            readOnly={isFixed}
            aria-label={isFixed ? `Fixed postcode ${fixedValue}` : `Postcode character ${fieldIndex + 1}`}
            className={`w-8 h-10 text-center border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono uppercase ${
              isFixed ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
            }`}
            maxLength={1}
          />
        );
      })}
    </div>
  );
};
