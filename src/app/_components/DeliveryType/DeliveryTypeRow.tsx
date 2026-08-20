import {
  Eye,
  EyeOff,
  Pencil,
} from "lucide-react";
import { type DeliveryType } from "@/app/_lib/validation/deliveryType";

type DeliveryTypeRowProps = {
  deliveryType: DeliveryType;
  isSaving: boolean;
  onEdit: (deliveryType: DeliveryType) => void;
  onToggle: (deliveryType: DeliveryType) => Promise<void>;
};

export const DeliveryTypeRow = ({
  deliveryType,
  isSaving,
  onEdit,
  onToggle,
}: DeliveryTypeRowProps) => (
  <li className={deliveryType.isActive ? "" : "bg-muted/45"}>
    <div className="flex min-h-20 items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-bold">{deliveryType.name}</p>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              deliveryType.isActive
                ? "bg-green-100 text-green-700"
                : "bg-gray-200 text-gray-500"
            }`}
          >
            {deliveryType.isActive ? "使用中" : "非表示"}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          ¥{deliveryType.currentUnitPrice.toLocaleString("ja-JP")} / 件
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => onToggle(deliveryType)}
          disabled={isSaving}
          aria-label={deliveryType.isActive ? "非表示にする" : "再表示する"}
          className={`flex size-9 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-50 ${
            deliveryType.isActive
              ? "bg-muted text-muted-foreground"
              : "border border-primary bg-white text-primary"
          }`}
        >
          {deliveryType.isActive ? (
            <EyeOff size={16} aria-hidden="true" />
          ) : (
            <Eye size={16} aria-hidden="true" />
          )}
        </button>
        <button
          type="button"
          onClick={() => onEdit(deliveryType)}
          disabled={isSaving}
          aria-label={`${deliveryType.name}を編集`}
          className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Pencil size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  </li>
);