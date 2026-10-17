import React from 'react';

interface StepIndicatorProps {
  currentStep: number;
  onStepClick: (step: number) => void;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  onStepClick
}) => {
  const steps = [
    { number: 1, label: '1. ข้อมูลผู้บันทึก' },
    { number: 2, label: '2. ข้อมูลผู้บริหาร' },
    { number: 3, label: '3. รายละเอียดการสื่อสาร' },
    { number: 4, label: '4. ปัญหาและข้อเสนอแนะ' }
  ];

  return (
    <div className="mwa-step-indicator">
      {steps.map((step) => {
        let stepClass = 'mwa-step';
        if (step.number === currentStep) {
          stepClass += ' active';
        } else if (step.number < currentStep) {
          stepClass += ' completed';
        }

        return (
          <div
            key={step.number}
            id={`step${step.number}`}
            className={stepClass}
            onClick={() => onStepClick(step.number)}
            role="button"
            tabIndex={0}
          >
            <span>{step.label}</span>
          </div>
        );
      })}
    </div>
  );
};
