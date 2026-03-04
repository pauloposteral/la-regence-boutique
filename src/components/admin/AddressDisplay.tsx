interface AddressProps {
  endereco: any;
}

const AddressDisplay = ({ endereco }: AddressProps) => {
  if (!endereco) return <span className="text-muted-foreground">—</span>;

  // Handle both JSON object and string
  const addr = typeof endereco === "string" ? JSON.parse(endereco) : endereco;

  const parts = [
    addr.logradouro && `${addr.logradouro}${addr.numero ? `, ${addr.numero}` : ""}`,
    addr.complemento,
    addr.bairro,
    addr.cidade && addr.estado ? `${addr.cidade}/${addr.estado}` : addr.cidade || addr.estado,
    addr.cep,
  ].filter(Boolean);

  if (parts.length === 0) return <span className="text-muted-foreground text-xs">{JSON.stringify(endereco)}</span>;

  return <span className="text-xs">{parts.join(" — ")}</span>;
};

export default AddressDisplay;
