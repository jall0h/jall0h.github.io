import pandas as pd

medals  = pd.read_csv("olympic_medals (2).csv")
athletes = pd.read_csv("olympic_athletes (2).csv")

medals["year"] = medals["slug_game"].str[-4:].astype(int)

medals = medals.merge(
    athletes[["athlete_url", "athlete_year_birth"]],
    on="athlete_url",
    how="left",
)

medals["age"] = medals["year"] - medals["athlete_year_birth"]

age_bins   = [0,  20,  25,  30,  35,  40,  200]
age_labels = ["Under 20", "20-24", "25-29", "30-34", "35-39", "40+"]
medals["age_group"] = pd.cut(medals["age"], bins=age_bins, labels=age_labels, right=False)



gold   = medals[medals["medal_type"] == "GOLD"  ].groupby(["year", "age_group"]).size().rename("gold")
silver = medals[medals["medal_type"] == "SILVER"].groupby(["year", "age_group"]).size().rename("silver")
bronze = medals[medals["medal_type"] == "BRONZE"].groupby(["year", "age_group"]).size().rename("bronze")

result = pd.concat([gold, silver, bronze], axis=1).fillna(0).astype(int).reset_index()
result["total"] = result["gold"] + result["silver"] + result["bronze"]
result = result.sort_values(["year", "age_group"]).reset_index(drop=True)

result.to_csv("medals_by_age_group.csv", index=False)
print(result.head(5).to_string(index=False))
