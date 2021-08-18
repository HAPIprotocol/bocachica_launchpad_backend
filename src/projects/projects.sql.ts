export const collectedAmountSql = `
  select
    coalesce(sum(amount), 0) as amount
  from
    (
    select
      "roundId",
      "publicKey",
      "amount",
      case
        when "solPowerCheck" = true and "solPowerScaling" = true then "solPower" between "minAmount" * "solPowerRate" and "maxAmount" * "solPowerRate"
        when "solPowerCheck" = true then "solPower" > 0
        else true
      end as "allowed"
    from
      (
      select
        pc."roundId",
        pc."publicKey",
        sum(pc."amount") as "amount",
        min(ua."solPowerAmount") as "solPower"
      from
        "project_contribution" pc
      join "user_account" ua on
        pc."publicKey" = ua."publicKey"
      group by
        pc."roundId",
        pc."publicKey") contrib
    join (
      select
        id,
        "minAmount",
        "maxAmount",
        "solPowerRate",
        "solPowerScaling"
      from
        "project_round") pr on
      contrib."roundId" = pr."id") t
  where
    "roundId" = $1 and "allowed" = true`;
