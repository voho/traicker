import { type ColorResult } from "react-color";
import Slider from "react-color/lib/components/slider/Slider";

type Props = {
  color?: string;
  onSelected: (color: string) => void;
  className?: string;
};

export function ColorPicker({ color, onSelected, className }: Props) {
  return (
    <div className={className}>
      <Slider color={color} onChange={(c: ColorResult) => onSelected(c.hex)} />
    </div>
  );
}
