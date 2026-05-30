export function useProtocolNavigation(protocolId: string, currentStep: number, totalSteps: number) {

    const canGoNext = currentStep < totalSteps //se posso seguir
    const canGoPrev = currentStep > 1 //se posso voltar
    const progress = (currentStep / totalSteps) * 100 //progresso em %

    const generateUrl = (protocol: string, step: number) => {
        return `/guided-protocol/${protocol}/step/${step}` //gerar url para passo especifico
    }

    return {
        canGoNext,
        canGoPrev,
        progress,
        nextStepUrl: () => generateUrl(protocolId, currentStep + 1), //se posso seguir, cria uma url para o prox. passo
        prevStepUrl: () => generateUrl(protocolId, currentStep - 1),
        goToStepUrl: (step: number) => generateUrl(protocolId, step),
    };
}