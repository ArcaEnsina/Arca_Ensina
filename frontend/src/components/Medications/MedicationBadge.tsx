import { Pill } from "lucide-react";
import { PillBottle } from "lucide-react";
import { Tablets } from "lucide-react";
import { Syringe } from "lucide-react";
import { ShieldPlus } from "lucide-react";
import { HeartPulse } from "lucide-react";
import { Bandage } from "lucide-react";
import { BriefcaseMedical } from "lucide-react";

function MedicationBadge({ name }: { name: string }) {
    return (
        <div className="bg-blue-500 text-white text-sm font-medium mr-2 p-2 rounded-full flex items-center">
            {name === "pill" ? (
                <Pill size={16} />
            ) : name === "tablets" ? (
                <Tablets size={16} />
            ) : name === "pills-bottle" ? (
                <PillBottle size={16} />
            ) : name === "syringe" ? (
                <Syringe size={16} />
            ) : name === "shield-plus" ? (
                <ShieldPlus size={16} />
            ) : name === "heart-pulse" ? (
                <HeartPulse size={16} />
            ) : name === "bandage" ? (
                <Bandage size={16} />
            ) : name === "briefcase-medical" ? (
                <BriefcaseMedical size={16} />
            ) : null}
        </div>
    );
}

export default MedicationBadge;