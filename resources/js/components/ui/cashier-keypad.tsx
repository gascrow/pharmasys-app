import * as React from "react"
import { cn } from "@/lib/utils"

interface CashierKeypadProps {
  value: string
  onChange: (value: string) => void
  onEnter?: () => void
  className?: string
  disabled?: boolean
  placeholder?: string
}

interface KeypadButtonProps {
  children: React.ReactNode
  onClick: () => void
  variant?: 'number' | 'operator' | 'function' | 'quick'
  className?: string
  disabled?: boolean
}

const KeypadButton = React.forwardRef<HTMLButtonElement, KeypadButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ children, onClick, variant = 'number', className, disabled = false, ...props }, ref) => {
    const baseClasses = "flex items-center justify-center font-medium rounded transition-all duration-200 transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2"
    
    const variantClasses = {
      number: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200",
      operator: "bg-blue-500 hover:bg-blue-600 text-white",
      function: "bg-red-500 hover:bg-red-600 text-white",
      quick: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200"
    }

    return (
      <button
        ref={ref}
        onClick={onClick}
        disabled={disabled}
        className={cn(
          baseClasses,
          variantClasses[variant],
          "h-10 w-10 md:h-11 md:w-11 text-xs md:text-sm",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

KeypadButton.displayName = "KeypadButton"

export const CashierKeypad = React.forwardRef<HTMLInputElement, CashierKeypadProps>(
  ({ value, onChange, onEnter, className, disabled = false, placeholder = "0", ...props }, ref) => {
    const [isPressed, setIsPressed] = React.useState<string | null>(null)

    const formatCurrency = (value: string) => {
      if (!value || value === '0') return '0'
      
      // Remove all non-digit and non-dot characters except the first dot
      const cleanValue = value.replace(/[^\d.]/g, '')
      
      // Split into integer and decimal parts
      const parts = cleanValue.split('.')
      const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')
      const decimalPart = parts.length > 1 ? '.' + parts[1] : ''
      
      return integerPart + decimalPart
    }

    const handleKeyPress = (key: string) => {
      if (disabled) return

      let newValue = value

      switch (key) {
        case 'C':
          newValue = '0'
          break
        case 'CE':
          newValue = '0'
          break
        case '←':
          if (newValue.length > 1) {
            newValue = newValue.slice(0, -1)
          } else {
            newValue = '0'
          }
          break
        case '.':
          if (!newValue.includes('.')) {
            newValue = newValue === '0' ? '0.' : newValue + '.'
          }
          break
        default:
          // Handle numbers
          if (newValue === '0') {
            newValue = key
          } else {
            newValue = newValue + key
          }
      }

      onChange(newValue)
    }

    const handleQuickAmount = (amount: string) => {
      if (disabled) return
      onChange(amount)
      // Jangan langsung submit, biarkan user menekan tombol submit
    }

    const handleEnter = () => {
      if (onEnter) onEnter()
    }

    const buttons = [
      { label: '7', value: '7', variant: 'number' as const },
      { label: '8', value: '8', variant: 'number' as const },
      { label: '9', value: '9', variant: 'number' as const },
      { label: 'C', value: 'C', variant: 'function' as const },
      { label: '4', value: '4', variant: 'number' as const },
      { label: '5', value: '5', variant: 'number' as const },
      { label: '6', value: '6', variant: 'number' as const },
      { label: 'CE', value: 'CE', variant: 'function' as const },
      { label: '1', value: '1', variant: 'number' as const },
      { label: '2', value: '2', variant: 'number' as const },
      { label: '3', value: '3', variant: 'number' as const },
      { label: '←', value: '←', variant: 'function' as const },
      { label: '.', value: '.', variant: 'operator' as const },
      { label: '0', value: '0', variant: 'number' as const },
      { label: '00', value: '00', variant: 'number' as const },
      { label: '000', value: '000', variant: 'number' as const },
    ]

    const quickAmounts = [
      { label: '20.000', value: '20000' },
      { label: '50.000', value: '50000' },
      { label: '100.000', value: '100000' },
    ]

    return (
      <div className={cn("space-y-4", className)}>
        {/* Display Screen */}
        <div className="bg-gray-900 rounded-lg p-4 border-2 border-gray-700 shadow-inner">
          <div className="text-right">
            <div className="text-gray-400 text-xs mb-1">TOTAL PEMBAYARAN</div>
            <div className="text-white text-3xl md:text-4xl font-bold font-mono tracking-wider">
              Rp {formatCurrency(value)}
            </div>
            {value === '0' && (
              <div className="text-gray-500 text-sm mt-1">{placeholder}</div>
            )}
          </div>
        </div>

        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-3 gap-2">
          {quickAmounts.map((amount) => (
            <button
              key={amount.value}
              onClick={() => handleQuickAmount(amount.value)}
              disabled={disabled}
              className={cn(
                "bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-3 rounded-lg transition-all duration-200 transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-400 border border-gray-300",
                "text-xs",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {formatCurrency(amount.value)}
            </button>
          ))}
        </div>

        {/* Main Keypad */}
        <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
          <div className="grid grid-cols-4 gap-1">
            {buttons.map((button) => (
              <KeypadButton
                key={button.value}
                onClick={() => {
                  if (button.value === 'Enter') {
                    handleEnter()
                  } else {
                    handleKeyPress(button.value)
                  }
                }}
                variant={button.variant}
                disabled={disabled}
                className={cn(
                  "text-xs md:text-sm p-1",
                  isPressed === button.value && "scale-95"
                )}
                onMouseDown={() => setIsPressed(button.value)}
                onMouseUp={() => setIsPressed(null)}
                onMouseLeave={() => setIsPressed(null)}
                onTouchStart={() => setIsPressed(button.value)}
                onTouchEnd={() => setIsPressed(null)}
              >
                {button.label}
              </KeypadButton>
            ))}
          </div>
        </div>

        {/* Hidden Input for Form Integration */}
        <input
          ref={ref}
          type="hidden"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          {...props}
        />
      </div>
    )
  }
)

CashierKeypad.displayName = "CashierKeypad"