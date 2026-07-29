import React from "react";
import { useField, useFormikContext } from "formik";
import Select from "react-select";
import { cn } from "@/lib/util";
// import { Label } from "../../ui/label";

interface Option {
    value: string;
    label: string;
}

interface SelectFieldProps {
    label?: string;
    name: string;
    options: Option[];
    className?: string;
    parentClassName?: string;
    isDisabled?: boolean;
    placeholder?: string;
    onChange?: (e: { target: { value: string, name: string } }) => void;
    value?: string;
    variant?: "default" | "borderless";
    borderRadius?: string;
}

const SelectField: React.FC<SelectFieldProps> = ({
    label,
    name,
    options,
    className,
    parentClassName,
    isDisabled = false,
    placeholder,
    onChange,
    value,
    variant = "default",
    borderRadius = "0.5rem",
}) => {
    const [field, meta] = useField(name);
    const { setFieldValue } = useFormikContext();

    // Find the currently selected option
    const selectedOption = options.find(option =>
        value !== undefined ? option.value === value : option.value === field.value
    );

    const handleChange = (option: Option | null) => {
        const newValue = option?.value || "";
        setFieldValue(name, newValue);
        // If external onChange handler exists, call it with an event-like object
        if (onChange) {
            const syntheticEvent = {
                target: {
                    name: name,
                    value: newValue
                }
            };
            onChange(syntheticEvent);
        }
    };

    return (
        <div className={`${parentClassName}`}>
            {label && (
                <label className="block font-medium text-g-gray-800 text-label-14" htmlFor={name}>
                    {label}
                </label>
            )}

            <Select
                inputId={name}
                name={name}
                className={cn(
                    "block w-full rounded-[var(--g-radius-sm)] focus:outline-none focus-ring-geist",
                    variant === "borderless" && "rounded-[var(--g-radius-md)] shadow-geist-menu",
                    className
                )}
                classNamePrefix="react-select"
                value={selectedOption}
                onChange={handleChange}
                options={options}
                isDisabled={isDisabled}
                placeholder={placeholder}
                styles={{
                    control: (base) => ({
                        ...base,
                        minHeight: '2.5rem',
                        borderColor: meta.touched && meta.error ? 'var(--g-red-700)' :
                            variant === "borderless" ? 'transparent' : base.borderColor,
                        boxShadow: variant === "borderless" ? 'none' : base.boxShadow,
                        marginTop: '0.25rem',
                        fontSize: '1rem',
                        ...(variant === "borderless" && {
                            backgroundColor: 'var(--g-background-100)',
                            border: 'none',
                            borderRadius: borderRadius || 'var(--g-radius-sm)',
                        }),
                    }),
                    placeholder: (base) => ({
                        ...base,
                        color: "var(--g-gray-700)",
                        fontSize: "14px",
                    }),
                }}
            />

            {meta.touched && meta.error && (
                <p className="text-g-red-700 text-copy-13 mt-1">{meta.error}</p>
            )}
        </div>
    );
};

export default SelectField;