Feature: Mentions

  Scenario Outline: User mentions another user in a post
    Given the user "<author>" is registered
    And the user "<mentioned>" is registered
    And "<author>" has a session token
    When "<author>" creates a post mentioning "<mentioned>"
    Then the mention post from "<author>" to "<mentioned>" should be created successfully

    Examples:
      | author | mentioned |
      | Alice  | Bob       |
      | Bob    | Alice     |


  Scenario Outline: User sees a post mentioning them
    Given the user "<mentioned>" is registered
    And "<mentioned>" has a session token
    When "<mentioned>" gets their mentions
    Then "<mentioned>" should see a post from "<author>" mentioning them

    Examples:
      | author | mentioned |
      | Alice  | Bob       |
      | Bob    | Alice     |