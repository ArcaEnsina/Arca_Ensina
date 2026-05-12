//arquivo para guardar as conversões das unidades selecionadas no frontend

//converter peso para kg:
function convertWeight(value: number, from: "kg" | "g"): number {
    if (from === "kg") {
        return value;
    } else if (from === "g") {
        return value / 1000;
    }
    throw new Error("Unidade não suportada");
}

//converter altura para cm:
function convertHeight(value: number, from: "cm" | "m"): number {
    if (from === "cm") {
        return value;
    } else if (from === "m") {
        return value * 100;
    }
    throw new Error("Unidade não suportada");
}

//converter idade para dias:
function convertAge(years: number, months?: number): number {
    let ageInDays = years * 365;
    if (months != undefined) {
        ageInDays += months * 30; // Aproximação de 30 dias por mês
    }
    return ageInDays;
}

//converter data de nascimento para idade em dias:
function convertBirthDate(birth: string): number {
    //YYY-MM-DD (django)
    const birthDate = new Date(birth);
    if (isNaN(birthDate.getTime())) {
        throw new Error("Data de nascimento inválida.")
    }
    else if (birthDate > new Date()) {
        throw new Error("Data de nascimento não pode ser no futuro.")
    }
    const today = new Date();
    const ageInDays = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
    return ageInDays;
}

export { convertWeight, convertHeight, convertAge, convertBirthDate };